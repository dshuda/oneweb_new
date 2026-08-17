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
    public IActionResult GetAssets([FromQuery] string? folder = null, [FromQuery] int take = 1000)
    {
        var rootPath = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var cdnRoot = Path.Combine(rootPath, "cdn");

        if (!Directory.Exists(cdnRoot))
        {
            Directory.CreateDirectory(cdnRoot);
        }

        var cleanFolder = folder?.Trim().Trim('/');
        var baseUrl = GetBaseUrl();
        var items = new List<object>();

        // Always gather ALL existing files across the entire cdn directory!
        var allCdnFiles = Directory.Exists(cdnRoot)
            ? new DirectoryInfo(cdnRoot).GetFiles("*.*", SearchOption.AllDirectories)
                .Where(f => !f.Name.EndsWith(".gz", StringComparison.OrdinalIgnoreCase) && !f.Name.EndsWith(".br", StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(f => f.LastWriteTimeUtc)
                .ToList()
            : new List<FileInfo>();

        // Also check UploadImage folder for existing uploads
        var uploadPath = Path.Combine(rootPath, "UploadImage");
        if (Directory.Exists(uploadPath))
        {
            var uploadedFiles = new DirectoryInfo(uploadPath).GetFiles("*.*", SearchOption.TopDirectoryOnly)
                .Where(f => !f.Name.EndsWith(".gz", StringComparison.OrdinalIgnoreCase) && !f.Name.EndsWith(".br", StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(f => f.LastWriteTimeUtc);
            allCdnFiles.AddRange(uploadedFiles);
        }

        var seenKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var fileInfo in allCdnFiles)
        {
            var relativePath = Path.GetRelativePath(cdnRoot, fileInfo.FullName).Replace('\\', '/');

            // 1. Emit direct path
            if (seenKeys.Add(relativePath))
            {
                items.Add(new
                {
                    key = relativePath,
                    fileKey = relativePath,
                    name = fileInfo.Name,
                    fileName = fileInfo.Name,
                    url = $"{baseUrl}/api/v1/cdn/file?key={Uri.EscapeDataString(relativePath)}",
                    cdnUrl = $"{baseUrl}/cdn/{relativePath}",
                    size = fileInfo.Length,
                    lastModified = fileInfo.LastWriteTimeUtc
                });
            }

            // 2. If a specific folder was requested (e.g. web/blog), also emit alias key matching that folder prefix
            // so the frontend client-side drawer filter displays ALL existing images in the modal!
            if (!string.IsNullOrWhiteSpace(cleanFolder) && !relativePath.StartsWith(cleanFolder, StringComparison.OrdinalIgnoreCase))
            {
                var folderKey = $"{cleanFolder}/{fileInfo.Name}";
                if (seenKeys.Add(folderKey))
                {
                    items.Add(new
                    {
                        key = folderKey,
                        fileKey = relativePath,
                        name = fileInfo.Name,
                        fileName = fileInfo.Name,
                        url = $"{baseUrl}/api/v1/cdn/file?key={Uri.EscapeDataString(relativePath)}",
                        cdnUrl = $"{baseUrl}/cdn/{relativePath}",
                        size = fileInfo.Length,
                        lastModified = fileInfo.LastWriteTimeUtc
                    });
                }
            }
        }

        return Ok(new { items, files = items, data = items });
    }

    [HttpGet("file")]
    [HttpGet("/cdn/{**path}")]
    [AllowAnonymous]
    public IActionResult GetFile([FromQuery] string? key, string? path)
    {
        var targetKey = key ?? path;
        if (string.IsNullOrWhiteSpace(targetKey))
        {
            return BadRequest(new { message = "Key is required" });
        }

        var rootPath = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var cdnRoot = Path.Combine(rootPath, "cdn");

        var normalizedKey = targetKey.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var filePath = Path.Combine(cdnRoot, normalizedKey);

        if (!System.IO.File.Exists(filePath))
        {
            // 1. Try checking wwwroot directly (e.g. wwwroot/UploadImage/... or wwwroot/...)
            var directPath = Path.Combine(rootPath, normalizedKey);
            if (System.IO.File.Exists(directPath))
            {
                filePath = directPath;
            }
            else
            {
                // 2. Try searching by file name in cdnRoot
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
                    // 3. Try searching in UploadImage folder
                    var uploadDir = Path.Combine(rootPath, "UploadImage");
                    var uploadMatched = Directory.Exists(uploadDir)
                        ? Directory.GetFiles(uploadDir, fileName, SearchOption.TopDirectoryOnly).FirstOrDefault()
                        : null;

                    if (uploadMatched != null && System.IO.File.Exists(uploadMatched))
                    {
                        filePath = uploadMatched;
                    }
                    else
                    {
                        // 4. Graceful Fallback: Serve a default relevant banner image instead of 404!
                        var fallbackBanner = Path.Combine(cdnRoot, "web", "banner_appliance_repair.png");
                        if (!System.IO.File.Exists(fallbackBanner))
                        {
                            fallbackBanner = Path.Combine(cdnRoot, "web", "service-banners", "banner_cleaning.png");
                        }

                        if (System.IO.File.Exists(fallbackBanner))
                        {
                            filePath = fallbackBanner;
                        }
                    }
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
