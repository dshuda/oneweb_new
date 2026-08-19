using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api.Controllers;

[ApiController]
[Route("api/v1/sliders")]
public class SlidersController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public SlidersController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Public: GET /api/v1/sliders
    [HttpGet()]
    public async Task<IActionResult> GetSliders()
    {
        var sliders = await _dbContext.Sliders
            .Where(s => s.Status)
            .OrderBy(s => s.Position).ThenBy(s => s.Id)
            .Select(s => new SliderDto(s.Id, s.Title, s.SubTitle, s.Image, s.Link, s.Position))
            .ToListAsync();

        return Ok(sliders);
    }

   

    public record SliderDto(long Id, string? Title, string? SubTitle, string? Image, string? Link, int Position);
}
