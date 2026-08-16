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
    [Authorize]
    [RequestSizeLimit(104857600)]
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)]
    public async Task<IActionResult> Upload([FromForm] UploadTO model)
    {
        if (model.Image == null || model.Image.Length == 0)
            return BadRequest(new { message = "No image uploaded" });

        // Allow only image files
        if (!model.Image.ContentType.StartsWith("image/"))
            return BadRequest(new { message = "Only image files are allowed" });

        var rootPath = GetRootPath();
        var uploadPath = Path.Combine(rootPath, UploadFolder);

        if (!Directory.Exists(uploadPath))
            Directory.CreateDirectory(uploadPath);

        // Unique file name
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(model.Image.FileName)}";
        var filePath = Path.Combine(uploadPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await model.Image.CopyToAsync(stream);
        }

        // Accessible URL through API proxy
        var url = $"/api/v1/UploadImage/{fileName}";

        return Ok(new
        {
            url
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
    [Authorize]
    public IActionResult GetAll()
    {
        var rootPath = GetRootPath();
        var uploadPath = Path.Combine(rootPath, UploadFolder);

        if (!Directory.Exists(uploadPath))
        {
            return Ok(new
            {
                images = new List<ImageDto>()
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
            images = imageUrls
        });
    }
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