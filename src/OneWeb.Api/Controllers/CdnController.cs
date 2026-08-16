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

    [HttpGet]
    public IActionResult GetAssets([FromQuery] string? folder = null, [FromQuery] int take = 500)
    {
        var rootPath = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var cdnRoot = Path.Combine(rootPath, "cdn");

        if (!Directory.Exists(cdnRoot))
        {
            Directory.CreateDirectory(cdnRoot);
        }

        var targetDir = string.IsNullOrWhiteSpace(folder)
            ? cdnRoot
            : Path.Combine(cdnRoot, folder.Replace('/', Path.DirectorySeparatorChar));

        var items = new List<object>();

        if (Directory.Exists(targetDir))
        {
            var files = Directory.GetFiles(targetDir, "*.*", SearchOption.AllDirectories)
                .Take(take);

            var baseUrl = $"{Request.Scheme}://{Request.Host}";

            foreach (var filePath in files)
            {
                var fileInfo = new FileInfo(filePath);
                var relativePath = Path.GetRelativePath(cdnRoot, filePath).Replace('\\', '/');

                items.Add(new
                {
                    key = relativePath,
                    url = $"{baseUrl}/cdn/{relativePath}",
                    size = fileInfo.Length,
                    lastModified = fileInfo.LastWriteTimeUtc
                });
            }
        }

        return Ok(new { items });
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload([FromForm] IFormFile? file, [FromForm] string? folder = null)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file provided" });
        }

        var rootPath = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var cdnRoot = Path.Combine(rootPath, "cdn");
        var targetFolder = string.IsNullOrWhiteSpace(folder) ? "web" : folder.Replace('/', Path.DirectorySeparatorChar);
        var uploadDir = Path.Combine(cdnRoot, targetFolder);

        if (!Directory.Exists(uploadDir))
        {
            Directory.CreateDirectory(uploadDir);
        }

        var fileName = Path.GetFileName(file.FileName);
        var filePath = Path.Combine(uploadDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var relativeKey = Path.GetRelativePath(cdnRoot, filePath).Replace('\\', '/');
        var baseUrl = $"{Request.Scheme}://{Request.Host}";

        return Ok(new
        {
            key = relativeKey,
            url = $"{baseUrl}/cdn/{relativeKey}",
            size = file.Length,
            lastModified = DateTime.UtcNow
        });
    }

    [HttpDelete]
    public IActionResult Delete([FromQuery] string? key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return BadRequest(new { message = "Key is required" });
        }

        var rootPath = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var cdnRoot = Path.Combine(rootPath, "cdn");
        var filePath = Path.Combine(cdnRoot, key.Replace('/', Path.DirectorySeparatorChar));

        if (System.IO.File.Exists(filePath))
        {
            System.IO.File.Delete(filePath);
        }

        return Ok(new { success = true, message = "Deleted" });
    }
}
