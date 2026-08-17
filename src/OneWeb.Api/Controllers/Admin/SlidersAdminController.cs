using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Api.DTOs;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/sliders")]
[Authorize(Roles = "admin,staff")]
public class SlidersAdminController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public SlidersAdminController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Public & Admin: GET /api/v1/sliders & GET /api/v1/admin/sliders
    [HttpGet]
    [HttpGet("/api/v1/sliders")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSliders()
    {
        var sliders = await _dbContext.Sliders
            .Where(s => s.Status == true || Request.Path.Value.Contains("/admin/"))
            .OrderBy(s => s.Position)
            .ThenBy(s => s.Id)
            .Select(s => new
            {
                s.Link,
                s.SubTitle,
                s.Title,
                s.Image,
                s.Status,
                s.Position,
                s.Id
            })
            .ToListAsync();

        if (Request.Path.Value?.Contains("/admin/") == true)
        {
            return ApiResponseFactory.Ok(sliders, HttpContext);
        }

        return Ok(new { items = sliders, data = sliders });
    }

    // Admin: POST /api/v1/admin/sliders
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateSlider([FromBody] CreateSliderRequest request)
    {
        var slider = new Slider
        {
            Title = request.Title,
            Image = request.Image,
            Link = request.Link,
            SubTitle = request.SubTitle,
            Position = request.Position,
            Status = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Sliders.Add(slider);
        await _dbContext.SaveChangesAsync();
        return ApiResponseFactory.Created(slider, HttpContext);
    }

    // Admin: PUT /api/v1/admin/sliders/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSlider(long id, [FromBody] UpdateSliderRequest request)
    {
        var slider = await _dbContext.Sliders.FindAsync(id);
        if (slider == null)
            return NotFound();
        slider.Image = request.Image;
        slider.SubTitle = request.SubTitle;
        slider.Status = request.Status;
        slider.Title = request.Title ?? slider.Title;
        slider.Link = request.Link ?? slider.Link;
        slider.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return ApiResponseFactory.Accepted(slider, HttpContext);
    }

    // Admin: DELETE /api/v1/admin/sliders/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSlider(long id)
    {
        var slider = await _dbContext.Sliders.FindAsync(id);
        if (slider == null)
            return NotFound();

        _dbContext.Sliders.Remove(slider);
        await _dbContext.SaveChangesAsync();

        return ApiResponseFactory.Accepted(slider, HttpContext);
    }

    public record SliderDto(long Id, string? Title, int? PhotoId, string? Link);
    public record CreateSliderRequest
    {
        public string? Title { get; set; }
        public string? SubTitle { get; set; }
        public string? Image { get; set; }
        public string? Link { get; set; }
        public int Position { get; set; }
        public bool Status { get; set; }
    };
    public record UpdateSliderRequest
    {
        public string? Title { get; set; }
        public string? SubTitle { get; set; }
        public string? Image { get; set; }
        public string? Link { get; set; }
        public int Position { get; set; }
        public bool Status { get; set; }
    }
}
