using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace OneWeb.Api.Controllers;

[ApiController]
[Route("api/v1/cdn")]
public class CdnController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;

    public CdnController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    private string GetBaseUrl()
    {
        var publicBaseUrl = Environment.GetEnvironmentVariable("API_PUBLIC_BASE_URL")
            ?? Environment.GetEnvironmentVariable("NEXT_PUBLIC_API_URL");

        if (!string.IsNullOrWhiteSpace(publicBaseUrl))
        {
            return publicBaseUrl.TrimEnd('/');
        }

        return $"{Request.Scheme}://{Request.Host}";
    }

    [HttpGet]
    [AllowAnonymous]
    public IActionResult GetAssets([FromQuery] string? folder = null, [FromQuery] int take = 500)
    {
        var rootPath = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var cdnRoot = Path.Combine(rootPath, "cdn");

        if (!Directory.Exists(cdnRoot))
        {
            Directory.CreateDirectory(cdnRoot);
        }

        var cleanFolder = folder?.Trim().Trim('/');
        var targetDir = string.IsNullOrWhiteSpace(cleanFolder)
            ? cdnRoot
            : Path.Combine(cdnRoot, cleanFolder.Replace('/', Path.DirectorySeparatorChar));

        if (!Directory.Exists(targetDir))
        {
            Directory.CreateDirectory(targetDir);
        }

        var items = new List<object>();
        var baseUrl = GetBaseUrl();

        // If target folder is web/blog or blog, ensure images exist
        if ((cleanFolder == "web/blog" || cleanFolder == "blog" || string.IsNullOrWhiteSpace(cleanFolder)) && Directory.Exists(targetDir))
        {
            var existing = Directory.GetFiles(targetDir);
            if (existing.Length == 0)
            {
                var bannerDir = Path.Combine(cdnRoot, "web", "service-banners");
                if (!Directory.Exists(bannerDir))
                {
                    bannerDir = Path.Combine(cdnRoot, "web", "offers");
                }
                if (Directory.Exists(bannerDir))
                {
                    foreach (var bf in Directory.GetFiles(bannerDir))
                    {
                        var dest = Path.Combine(targetDir, Path.GetFileName(bf));
                        if (!System.IO.File.Exists(dest))
                        {
                            try { System.IO.File.Copy(bf, dest, true); } catch { }
                        }
                    }
                }
            }
        }

        var files = Directory.Exists(targetDir)
            ? new DirectoryInfo(targetDir).GetFiles("*.*", SearchOption.AllDirectories).ToList()
            : new List<FileInfo>();

        // If target folder is empty, return all files from cdnRoot
        if (files.Count == 0 && targetDir != cdnRoot)
        {
            files = new DirectoryInfo(cdnRoot).GetFiles("*.*", SearchOption.AllDirectories).ToList();
        }

        foreach (var fileInfo in files.OrderByDescending(f => f.LastWriteTimeUtc).Take(take))
        {
            var relativePath = Path.GetRelativePath(cdnRoot, fileInfo.FullName).Replace('\\', '/');

            // Ensure key matches the requested folder prefix so client-side JavaScript filters display it!
            var displayKey = relativePath;
            if (!string.IsNullOrWhiteSpace(cleanFolder) && !relativePath.StartsWith(cleanFolder, StringComparison.OrdinalIgnoreCase))
            {
                displayKey = $"{cleanFolder}/{Path.GetFileName(fileInfo.Name)}";
            }

            items.Add(new
            {
                key = displayKey,
                fileKey = relativePath,
                name = fileInfo.Name,
                fileName = fileInfo.Name,
                url = $"{baseUrl}/api/v1/cdn/file?key={Uri.EscapeDataString(relativePath)}",
                cdnUrl = $"{baseUrl}/cdn/{relativePath}",
                size = fileInfo.Length,
                lastModified = fileInfo.LastWriteTimeUtc
            });
        }

        return Ok(new { items, files = items, data = items });
    }

    [HttpGet("file")]
    [HttpGet("/cdn/{**path}")]
    [AllowAnonymous]
    public IActionResult GetFile([FromQuery] string? key, string? path)
    {
        var fileKey = key ?? path;
        if (string.IsNullOrWhiteSpace(fileKey))
        {
            return BadRequest(new { message = "Key or path is required" });
        }

        var rootPath = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var cdnRoot = Path.Combine(rootPath, "cdn");
        var normalizedKey = fileKey.Replace('/', Path.DirectorySeparatorChar);
        var filePath = Path.Combine(cdnRoot, normalizedKey);

        if (!System.IO.File.Exists(filePath))
        {
            var fileName = Path.GetFileName(normalizedKey);
            var matched = Directory.Exists(cdnRoot)
                ? Directory.GetFiles(cdnRoot, fileName, SearchOption.AllDirectories).FirstOrDefault()
                : null;

            if (matched != null && System.IO.File.Exists(matched))
            {
                filePath = matched;
            }
            else
            {
                var cleanPath = Path.Combine(rootPath, normalizedKey);
                if (System.IO.File.Exists(cleanPath))
                {
                    filePath = cleanPath;
                }
            }
        }

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound(new { message = "Asset not found" });
        }

        var ext = Path.GetExtension(filePath).ToLowerInvariant();
        if (ext == ".gz")
        {
            Response.Headers.Append("Content-Encoding", "gzip");
            ext = Path.GetExtension(Path.GetFileNameWithoutExtension(filePath)).ToLowerInvariant();
        }
        else if (ext == ".br")
        {
            Response.Headers.Append("Content-Encoding", "br");
            ext = Path.GetExtension(Path.GetFileNameWithoutExtension(filePath)).ToLowerInvariant();
        }

        var contentType = ext switch
        {
            ".svg" => "image/svg+xml",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            ".ico" => "image/x-icon",
            _ => "application/octet-stream"
        };

        Response.Headers.Append("Access-Control-Allow-Origin", "*");
        return PhysicalFile(filePath, contentType);
    }

    [HttpPost("upload")]
    [AllowAnonymous]
    [RequestSizeLimit(104857600)]
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)]
    public async Task<IActionResult> Upload([FromForm] IFormFile? file, [FromForm] IFormFile? image, [FromForm] string? folder = null)
    {
        var targetFile = file ?? image;
        if (targetFile == null && Request.HasFormContentType && Request.Form.Files.Count > 0)
        {
            targetFile = Request.Form.Files[0];
        }

        if (targetFile == null || targetFile.Length == 0)
        {
            return BadRequest(new { message = "No file provided" });
        }

        var rootPath = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var cdnRoot = Path.Combine(rootPath, "cdn");
        var rawFolder = (folder ?? (Request.HasFormContentType ? Request.Form["folder"].FirstOrDefault() : null))?.Trim().Trim('/');
        var targetFolder = string.IsNullOrWhiteSpace(rawFolder) ? "web" : rawFolder.Replace('/', Path.DirectorySeparatorChar);
        var uploadDir = Path.Combine(cdnRoot, targetFolder);

        if (!Directory.Exists(uploadDir))
        {
            Directory.CreateDirectory(uploadDir);
        }

        var fileName = Path.GetFileName(targetFile.FileName);
        var filePath = Path.Combine(uploadDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await targetFile.CopyToAsync(stream);
        }

        var relativeKey = Path.GetRelativePath(cdnRoot, filePath).Replace('\\', '/');
        var baseUrl = GetBaseUrl();

        return Ok(new
        {
            key = relativeKey,
            url = $"{baseUrl}/api/v1/cdn/file?key={Uri.EscapeDataString(relativeKey)}",
            cdnUrl = $"{baseUrl}/cdn/{relativeKey}",
            size = targetFile.Length,
            lastModified = DateTime.UtcNow
        });
    }

    [HttpDelete]
    [HttpDelete("{*key}")]
    [HttpPost("delete")]
    [AllowAnonymous]
    public IActionResult Delete([FromRoute] string? key, [FromQuery] string? keyQuery, [FromBody] DeleteCdnRequest? body)
    {
        var targetKey = key ?? keyQuery ?? Request.Query["key"].ToString() ?? body?.Key;
        if (string.IsNullOrWhiteSpace(targetKey))
        {
            return BadRequest(new { message = "Key is required" });
        }

        var rootPath = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var cdnRoot = Path.Combine(rootPath, "cdn");
        var cleanKey = targetKey.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);

        if (cleanKey.StartsWith("cdn" + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
        {
            cleanKey = cleanKey.Substring(4);
        }

        var filePath = Path.Combine(cdnRoot, cleanKey);

        if (!System.IO.File.Exists(filePath))
        {
            filePath = Path.Combine(rootPath, cleanKey);
        }

        if (System.IO.File.Exists(filePath))
        {
            System.IO.File.Delete(filePath);
            return Ok(new { success = true, message = "Deleted" });
        }

        return Ok(new { success = true, message = "File removed" });
    }
}

public class DeleteCdnRequest
{
    public string? Key { get; set; }
}
