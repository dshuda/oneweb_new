using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;
using System.Text.Json;

namespace OneWeb.Api.Controllers;

[ApiController]
[Route("api/v1/blogs")]
public class BlogsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly StackExchange.Redis.IDatabase _redis;

    public BlogsController(AppDbContext dbContext, StackExchange.Redis.IConnectionMultiplexer redis)
    {
        _dbContext = dbContext;
        _redis = redis.GetDatabase();
    }

    // Public: GET /api/v1/blogs
    [HttpGet()]
    public async Task<IActionResult> GetBlogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] long? categoryId = null)
    {
        var query = _dbContext.Blogs
            .Include(b => b.Category)
            .Where(b => b.Status == true);

        if (categoryId.HasValue && categoryId.Value > 0)
            query = query.Where(b => b.CategoryId == categoryId);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var blogs = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BlogDto(
                b.Id,
                b.Title,
                b.Slug,
                b.Image,
                b.CreatedAt,
                b.Category != null ? b.Category.Name : "General",
                b.CategoryId,
                b.Content))
            .ToListAsync();

        return Ok(new { items = blogs, totalCount, page, pageSize, totalPages });
    }

    // Public: GET /api/v1/blogs/categories
    // Declared before the {slug} route below; a literal segment still wins in
    // routing, but keeping them adjacent makes the overlap obvious.
    [HttpGet("categories")]
    public async Task<IActionResult> GetBlogCategories()
    {
        var categories = await _dbContext.BlogCategories
            .Where(c => c.Status)
            .OrderBy(c => c.Name)
            .Select(c => new { c.Id, c.Name, c.Slug })
            .ToListAsync();

        return Ok(categories);
    }

    // Public: GET /api/v1/blogs/{slug}
    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBlogBySlug(string slug)
    {
        var cacheKey = $"blog:{slug}";
        var cached = await _redis.StringGetAsync(cacheKey);
        if (!cached.IsNullOrEmpty)
        {
            var cachedBlog = JsonSerializer.Deserialize<BlogDetailDto>((string)cached!);
            return Ok(cachedBlog);
        }

        var blog = await _dbContext.Blogs
            .Include(b => b.Category)
            .Include(b => b.Translations)
            .FirstOrDefaultAsync(b => b.Slug == slug && b.Status == true);

        if (blog == null)
            return NotFound();

        var translations = blog.Translations?
            .Select(t => new BlogTranslationDto(t.Lang, t.Title, t.Content, t.AppContent))
            .ToList() ?? new List<BlogTranslationDto>();

        var result = new BlogDetailDto(
            blog.Id, blog.Title, blog.Slug, blog.Image,
            blog.Content, blog.AppContent, blog.MetaKeywords,
            blog.MetaDescription, blog.CreatedAt,
            blog.Category != null ? blog.Category.Name : "General",
            blog.CategoryId, translations);

        await _redis.StringSetAsync(cacheKey, JsonSerializer.Serialize(result), TimeSpan.FromHours(24));

        return Ok(result);
    }

    // Admin: POST /api/v1/admin/blogs
    [HttpPost("/api/v1/admin/blogs")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> CreateBlog([FromBody] CreateBlogRequest request)
    {
        var categoryId = (request.CategoryId.HasValue && request.CategoryId.Value > 0)
            ? request.CategoryId.Value
            : (long?)null;

        var slug = !string.IsNullOrWhiteSpace(request.Slug)
            ? request.Slug.Trim()
            : request.Title.ToLowerInvariant().Trim().Replace(" ", "-");

        var blog = new Blog
        {
            Title = request.Title,
            Slug = slug,
            CategoryId = categoryId,
            Content = request.Content,
            AppContent = request.AppContent,
            Image = request.Image,
            MetaKeywords = request.MetaKeywords,
            MetaDescription = request.MetaDescription,
            Status = request.Status ?? true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Blogs.Add(blog);
        await _dbContext.SaveChangesAsync();

        return Created($"/api/v1/blogs/{blog.Slug}", new { id = blog.Id, message = "Blog created successfully" });
    }

    // Admin: PUT /api/v1/admin/blogs/{id}
    [HttpPut("/api/v1/admin/blogs/{id}")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> UpdateBlog(long id, [FromBody] UpdateBlogRequest request)
    {
        var blog = await _dbContext.Blogs.FindAsync(id);
        if (blog == null)
            return NotFound();

        blog.Title = request.Title ?? blog.Title;
        blog.Slug = request.Slug ?? blog.Slug;

        if (request.CategoryId.HasValue)
        {
            blog.CategoryId = request.CategoryId.Value > 0 ? request.CategoryId.Value : (long?)null;
        }

        blog.Content = request.Content ?? blog.Content;
        blog.AppContent = request.AppContent ?? blog.AppContent;
        blog.Image = request.Image ?? blog.Image;
        blog.MetaKeywords = request.MetaKeywords ?? blog.MetaKeywords;
        blog.MetaDescription = request.MetaDescription ?? blog.MetaDescription;
        if (request.Status.HasValue) blog.Status = request.Status.Value;
        blog.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        // Invalidate cache
        await _redis.KeyDeleteAsync($"blog:{blog.Slug}");

        return Ok(new { message = "Blog updated" });
    }

    // Admin: DELETE /api/v1/admin/blogs/{id}
    [HttpDelete("/api/v1/admin/blogs/{id}")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> DeleteBlog(long id)
    {
        var blog = await _dbContext.Blogs.FindAsync(id);
        if (blog == null)
            return NotFound();

        blog.Status = false;
        blog.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return Ok(new { message = "Blog deleted" });
    }

    // Admin: POST /api/v1/admin/blogs/{id}/translations
    [HttpPost("/api/v1/admin/blogs/{id}/translations")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> AddTranslation(long id, [FromBody] AddTranslationRequest request)
    {
        var blog = await _dbContext.Blogs.FindAsync(id);
        if (blog == null)
            return NotFound();

        var translation = new BlogTranslation
        {
            BlogId = id,
            Lang = request.Lang,
            Title = request.Title,
            Content = request.Content,
            AppContent = request.AppContent,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.BlogTranslations.Add(translation);
        await _dbContext.SaveChangesAsync();

        return Ok(new { message = "Translation added" });
    }

    public record BlogDto(
        long Id, string Title, string Slug, string? Image, DateTime? CreatedAt,
        string? CategoryName = null, long? CategoryId = null, string? Content = null);
    public record BlogDetailDto(
        long Id, string Title, string Slug, string? Image,
        string? Content, string? AppContent, string? MetaKeywords,
        string? MetaDescription, DateTime? CreatedAt,
        string? CategoryName, long? CategoryId,
        List<BlogTranslationDto> Translations);
    public record BlogTranslationDto(string? Lang, string? Title, string? Content, string? AppContent);
    public record CreateBlogRequest(
        string Title, string Slug, long? CategoryId, string? Content,
        string? AppContent, string? Image, string? MetaKeywords, string? MetaDescription, bool? Status = true);
    public record UpdateBlogRequest(
        string? Title, string? Slug, long? CategoryId, string? Content,
        string? AppContent, string? Image, string? MetaKeywords, string? MetaDescription, bool? Status = true);
    public record AddTranslationRequest(string Lang, string Title, string Content, string? AppContent);
}
