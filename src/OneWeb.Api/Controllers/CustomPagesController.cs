using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api.Controllers;

/// <summary>
/// Static content pages (terms, privacy, about, contact). Ported from the
/// Laravel CustomPage feature: the storefront and app fetch a page by its
/// <c>link</c> key, while admins manage the full set.
/// </summary>
[ApiController]
[Route("api/v1/pages")]
public class CustomPagesController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public CustomPagesController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Public: only published pages, summary only.
    [HttpGet]
    public async Task<IActionResult> GetPages([FromQuery] string? type)
    {
        var query = _dbContext.CustomPages.Where(p => p.Status);

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(p => p.Type == type);

        var pages = await query
            .OrderBy(p => p.Title)
            .Select(p => new { p.Id, p.Title, p.Slug, p.Link, p.Type })
            .ToListAsync();

        return Ok(pages);
    }

    // Public: GET /api/v1/pages/{link} — the storefront's "terms" etc.
    [HttpGet("{link}")]
    public async Task<IActionResult> GetPage(string link, [FromQuery] string? lang)
    {
        var page = await _dbContext.CustomPages
            .Include(p => p.Translations)
            .FirstOrDefaultAsync(p => p.Link == link && p.Status);

        if (page == null)
            return NotFound(new { message = "Page not found" });

        // Fall back to the base row when no translation exists for the locale.
        var translation = string.IsNullOrWhiteSpace(lang)
            ? null
            : page.Translations.FirstOrDefault(t => t.Lang == lang);

        return Ok(new
        {
            page.Id,
            Title = translation?.Title ?? page.Title,
            page.Slug,
            page.Link,
            page.Type,
            Content = translation?.Content ?? page.Content,
            page.MetaTitle,
            page.MetaDescription,
            page.MetaKeywords,
            page.UpdatedAt,
        });
    }

    // Admin: full list including drafts.
    [HttpGet("/api/v1/admin/pages")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> GetAllPages()
    {
        var pages = await _dbContext.CustomPages
            .OrderBy(p => p.Title)
            .Select(p => new
            {
                p.Id, p.Title, p.Slug, p.Link, p.Type, p.Content,
                p.Status, p.MetaTitle, p.MetaDescription, p.MetaKeywords,
                p.CreatedAt, p.UpdatedAt,
            })
            .ToListAsync();

        return Ok(pages);
    }

    [HttpPost("/api/v1/admin/pages")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> CreatePage([FromBody] SavePageRequest request)
    {
        var link = (request.Link ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(link))
            return BadRequest(new { message = "Link is required" });

        if (await _dbContext.CustomPages.AnyAsync(p => p.Link == link))
            return Conflict(new { message = $"A page with the link \"{link}\" already exists" });

        var page = new CustomPage
        {
            Title = request.Title,
            Slug = string.IsNullOrWhiteSpace(request.Slug) ? link : request.Slug!,
            Link = link,
            Type = string.IsNullOrWhiteSpace(request.Type) ? "web" : request.Type!,
            Content = request.Content,
            Status = request.Status,
            MetaTitle = request.MetaTitle,
            MetaDescription = request.MetaDescription,
            MetaKeywords = request.MetaKeywords,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _dbContext.CustomPages.Add(page);
        await _dbContext.SaveChangesAsync();

        return Created($"/api/v1/pages/{page.Link}", new { page.Id });
    }

    [HttpPut("/api/v1/admin/pages/{id}")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> UpdatePage(long id, [FromBody] SavePageRequest request)
    {
        var page = await _dbContext.CustomPages.FirstOrDefaultAsync(p => p.Id == id);
        if (page == null)
            return NotFound();

        var link = (request.Link ?? page.Link).Trim();
        if (link != page.Link && await _dbContext.CustomPages.AnyAsync(p => p.Link == link && p.Id != id))
            return Conflict(new { message = $"A page with the link \"{link}\" already exists" });

        page.Title = request.Title;
        page.Slug = string.IsNullOrWhiteSpace(request.Slug) ? link : request.Slug!;
        page.Link = link;
        page.Type = string.IsNullOrWhiteSpace(request.Type) ? page.Type : request.Type!;
        page.Content = request.Content;
        page.Status = request.Status;
        page.MetaTitle = request.MetaTitle;
        page.MetaDescription = request.MetaDescription;
        page.MetaKeywords = request.MetaKeywords;
        page.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return Ok(new { message = "Page updated" });
    }

    [HttpDelete("/api/v1/admin/pages/{id}")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> DeletePage(long id)
    {
        var page = await _dbContext.CustomPages.FirstOrDefaultAsync(p => p.Id == id);
        if (page == null)
            return NotFound();

        _dbContext.CustomPages.Remove(page);
        await _dbContext.SaveChangesAsync();
        return Ok(new { message = "Page deleted" });
    }

    public record SavePageRequest(
        string Title,
        string? Slug,
        string? Link,
        string? Type,
        string? Content,
        bool Status,
        string? MetaTitle,
        string? MetaDescription,
        string? MetaKeywords);
}
