using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace OneWeb.Api.Controllers.Admin;

[Route("api/v1/admin/[controller]")]
[ApiController]
[Authorize]
public class ImagesController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;

    public ImagesController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    // Folder name
    private const string UploadFolder = "UploadImage";

    /// <summary>
    /// Upload Image
    /// POST: api/images/upload
    /// </summary>
    [HttpPost()]
    public async Task<IActionResult> Upload([FromForm] UploadTO model)
    {
        if (model.Image == null || model.Image.Length == 0)
            return BadRequest(new { message = "No image uploaded" });

        // Allow only image files
        if (!model.Image.ContentType.StartsWith("image/"))
            return BadRequest(new { message = "Only image files are allowed" });

        // Create folder if not exists
        var uploadPath = Path.Combine(
            _environment.WebRootPath,
            UploadFolder
        );

        if (!Directory.Exists(uploadPath))
            Directory.CreateDirectory(uploadPath);

        // Unique file name
        var fileName =
            $"{Guid.NewGuid()}{Path.GetExtension(model.Image.FileName)}";

        var filePath = Path.Combine(uploadPath, fileName);

        // Save file
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await model.Image.CopyToAsync(stream);
        }

        // File URL
        var url =
            $"/{UploadFolder}/{fileName}";

        return Ok(new
        {
            url
        });
    }

    /// <summary>
    /// Get All Images
    /// GET: api/images/list
    /// </summary>
    [HttpGet()]
    public IActionResult GetAll()
    {
        var uploadPath = Path.Combine(
            _environment.WebRootPath,
            UploadFolder
        );

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
                    Url = $"/{UploadFolder}/{file.Name}",
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
    public string Id { get; set; }          // unique identifier for delete
    public string Url { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string FileName { get; set; }
}

public record UploadTO
{
    public IFormFile Image { get; set; }
}