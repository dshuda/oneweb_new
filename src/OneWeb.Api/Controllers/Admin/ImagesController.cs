using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace OneWeb.Api.Controllers.Admin;

[Route("api/v1/admin/[controller]")]
[ApiController]
public class ImagesController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;

    public ImagesController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    private const string UploadFolder = "UploadImage";

    private string GetRootPath()
    {
        return _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
    }

    /// <summary>
    /// Upload Image
    /// POST: api/v1/admin/images
    /// </summary>
    [HttpPost]
    [HttpPost("/api/v1/images")]
    [HttpPost("/api/v1/admin/media/upload")]
    [HttpPost("/api/v1/admin/assets/upload")]
    [AllowAnonymous]
    [RequestSizeLimit(104857600)]
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)]
    public async Task<IActionResult> Upload([FromForm] IFormFile? image, [FromForm] IFormFile? file, [FromForm] UploadTO? model)
    {
        var targetFile = image ?? file ?? model?.Image;
        if (targetFile == null && Request.HasFormContentType && Request.Form.Files.Count > 0)
        {
            targetFile = Request.Form.Files[0];
        }

        if (targetFile == null || targetFile.Length == 0)
            return BadRequest(new { message = "No image uploaded" });

        var rootPath = GetRootPath();
        var uploadPath = Path.Combine(rootPath, UploadFolder);

        if (!Directory.Exists(uploadPath))
            Directory.CreateDirectory(uploadPath);

        // Unique file name
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(targetFile.FileName)}";
        var filePath = Path.Combine(uploadPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await targetFile.CopyToAsync(stream);
        }

        // Accessible URL through API proxy
        var url = $"/api/v1/UploadImage/{fileName}";

        return Ok(new
        {
            url,
            imageUrl = url,
            fileName,
            path = url,
            success = true
        });
    }

    /// <summary>
    /// Stream image by filename directly
    /// </summary>
    [HttpGet("/api/v1/UploadImage/{fileName}")]
    [HttpGet("/UploadImage/{fileName}")]
    [HttpGet("file")]
    [AllowAnonymous]
    public IActionResult GetFile(string? fileName, [FromQuery] string? name)
    {
        var targetName = fileName ?? name;
        if (string.IsNullOrWhiteSpace(targetName))
            return BadRequest(new { message = "FileName is required" });

        var rootPath = GetRootPath();
        var uploadPath = Path.Combine(rootPath, UploadFolder);
        var filePath = Path.Combine(uploadPath, Path.GetFileName(targetName));

        if (!System.IO.File.Exists(filePath))
        {
            filePath = Path.Combine(rootPath, targetName.TrimStart('/'));
            if (!System.IO.File.Exists(filePath))
                return NotFound(new { message = "Image not found" });
        }

        var ext = Path.GetExtension(filePath).ToLowerInvariant();
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

        return PhysicalFile(filePath, contentType);
    }

    /// <summary>
    /// Get All Images
    /// GET: api/v1/admin/images
    /// </summary>
    [HttpGet]
    [HttpGet("/api/v1/images")]
    [HttpGet("/api/v1/admin/assets")]
    [HttpGet("/api/v1/admin/media")]
    [Authorize]
    public IActionResult GetAll()
    {
        var rootPath = GetRootPath();
        var uploadPath = Path.Combine(rootPath, UploadFolder);

        if (!Directory.Exists(uploadPath))
        {
            return Ok(new
            {
                images = new List<ImageDto>(),
                items = new List<ImageDto>(),
                data = new List<ImageDto>()
            });
        }

        var directory = new DirectoryInfo(uploadPath);
        var imageUrls = directory.GetFiles()
            .Select(file =>
            {
                var id = Path.GetFileNameWithoutExtension(file.Name);

                return new ImageDto
                {
                    Id = id,
                    FileName = file.Name,
                    Url = $"/api/v1/UploadImage/{file.Name}",
                    CreatedAt = file.CreationTime,
                    UpdatedAt = file.LastWriteTime
                };
            })
            .ToList();

        return Ok(new
        {
            images = imageUrls,
            items = imageUrls,
            data = imageUrls
        });
    }
    /// <summary>
    /// Delete Image
    /// DELETE: api/v1/admin/images/{id}
    /// DELETE: api/v1/admin/images
    /// </summary>
    [HttpDelete("{id}")]
    [HttpDelete]
    [HttpPost("delete")]
    [AllowAnonymous]
    public IActionResult Delete(string? id, [FromQuery] string? fileName, [FromQuery] string? key, [FromBody] DeleteImageRequest? body)
    {
        var target = id ?? fileName ?? key ?? body?.Id ?? body?.FileName ?? body?.Key;
        if (string.IsNullOrWhiteSpace(target))
        {
            return BadRequest(new { message = "Image ID or fileName is required" });
        }

        var rootPath = GetRootPath();
        var uploadPath = Path.Combine(rootPath, UploadFolder);
        var baseName = Path.GetFileName(target);

        var filePath = Path.Combine(uploadPath, baseName);
        if (!System.IO.File.Exists(filePath))
        {
            var matchedFile = Directory.Exists(uploadPath)
                ? Directory.GetFiles(uploadPath, $"{baseName}.*").FirstOrDefault()
                : null;

            if (matchedFile != null)
            {
                filePath = matchedFile;
            }
            else
            {
                filePath = Path.Combine(rootPath, target.TrimStart('/'));
            }
        }

        if (System.IO.File.Exists(filePath))
        {
            System.IO.File.Delete(filePath);
            return Ok(new { success = true, message = "Image deleted successfully" });
        }

        return Ok(new { success = true, message = "Image removed" });
    }
}

public class DeleteImageRequest
{
    public string? Id { get; set; }
    public string? FileName { get; set; }
    public string? Key { get; set; }
}

public class ImageDto
{
    public string Id { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string FileName { get; set; } = string.Empty;
}

public record UploadTO
{
    public IFormFile? Image { get; set; }
}