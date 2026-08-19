using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneWeb.Domain.Interfaces;

namespace OneWeb.Api.Controllers;

/// <summary>
/// Image uploads to the CDN. Admin/staff only — these URLs are written onto
/// public storefront records.
/// </summary>
[ApiController]
[Route("api/v1/cdn")]
[Authorize(Roles = "admin,staff")]
public class CdnController : ControllerBase
{
    private const long MaxBytes = 10 * 1024 * 1024; // 10 MB

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml", "image/gif", "image/avif"
    };

    private readonly ICdnService _cdn;

    public CdnController(ICdnService cdn)
    {
        _cdn = cdn;
    }

    /// <summary>POST /api/v1/cdn/upload — multipart form with "file" (and optional "folder").</summary>
    [HttpPost("upload")]
    [RequestSizeLimit(MaxBytes)]
    public async Task<IActionResult> Upload(
        IFormFile file,
        [FromForm] string? folder,
        CancellationToken cancellationToken)
    {
        if (!_cdn.IsEnabled)
            return StatusCode(503, new { message = "CDN is not configured" });

        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file was uploaded" });

        if (file.Length > MaxBytes)
            return BadRequest(new { message = "File exceeds the 10 MB limit" });

        if (!AllowedContentTypes.Contains(file.ContentType))
            return BadRequest(new { message = $"Unsupported content type: {file.ContentType}" });

        await using var stream = file.OpenReadStream();
        var result = await _cdn.UploadAsync(
            stream, file.FileName, file.ContentType, folder, cancellationToken);

        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(new { url = result.Url, key = result.Key });
    }

    /// <summary>
    /// GET /api/v1/cdn?folder=web/service-icons — browse what is on the CDN so
    /// the portal can manage assets, not just upload them.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? folder,
        [FromQuery] int take = 200,
        [FromQuery] string? cursor = null,
        CancellationToken cancellationToken = default)
    {
        if (!_cdn.IsEnabled)
            return StatusCode(503, new { message = "CDN is not configured" });

        var result = await _cdn.ListAsync(folder, take, cursor, cancellationToken);
        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(new
        {
            items = result.Items,
            nextCursor = result.NextContinuationToken,
            count = result.Items.Count
        });
    }

    /// <summary>DELETE /api/v1/cdn?key=Onetap/web/service-banners/foo-ab12cd34.png</summary>
    [HttpDelete]
    public async Task<IActionResult> Delete([FromQuery] string key, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(key))
            return BadRequest(new { message = "A key is required" });

        var deleted = await _cdn.DeleteAsync(key, cancellationToken);
        return deleted ? Ok(new { message = "Deleted" }) : BadRequest(new { message = "Delete failed" });
    }
}
