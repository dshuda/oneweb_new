using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Api.DTOs;
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

    // Public & Admin: GET /api/v1/blogs & GET /api/v1/admin/blogs
    [HttpGet]
    [HttpGet("/api/v1/admin/blogs")]
    public async Task<IActionResult> GetBlogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] long? categoryId = null,
        [FromQuery] string? search = null)
    {
        var query = _dbContext.Blogs
            .Include(b => b.Category)
            .AsQueryable();

        // Check if admin request
        bool isAdmin = Request.Path.Value?.Contains("/admin/") == true;
        if (!isAdmin)
        {
            query = query.Where(b => b.Status == true);
        }

        if (categoryId.HasValue && categoryId.Value > 0)
            query = query.Where(b => b.CategoryId == categoryId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(b => b.Title.ToLower().Contains(s) || (b.Slug != null && b.Slug.ToLower().Contains(s)));
        }

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var blogs = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new
            {
                id = b.Id,
                title = b.Title,
                slug = b.Slug,
                image = b.Image,
                imageUrl = b.Image,
                bannerImage = b.Image,
                thumbnail = b.Image,
                featuredImage = b.Image,
                coverImage = b.Image,
                categoryId = b.CategoryId,
                categoryName = b.Category != null ? b.Category.Name : null,
                category = b.Category != null ? new { id = b.Category.Id, name = b.Category.Name } : null,
                content = b.Content,
                appContent = b.AppContent,
                metaKeywords = b.MetaKeywords,
                metaDescription = b.MetaDescription,
                status = b.Status,
                createdAt = b.CreatedAt,
                updatedAt = b.UpdatedAt
            })
            .ToListAsync();

        if (isAdmin)
        {
            return ApiResponseFactory.Ok(new
            {
                items = blogs,
                data = blogs,
                totalCount,
                page,
                pageSize,
                totalPages
            }, HttpContext);
        }

        return Ok(new { items = blogs, totalCount, page, pageSize, totalPages });
    }

    // Public & Admin: GET /api/v1/blogs/categories
    [HttpGet("categories")]
    [HttpGet("/api/v1/blog-categories")]
    [HttpGet("/api/v1/admin/blogs/categories")]
    [HttpGet("/api/v1/admin/blog-categories")]
    public async Task<IActionResult> GetBlogCategories()
    {
        var categories = await _dbContext.BlogCategories
            .OrderBy(c => c.Id)
            .Select(c => new
            {
                id = c.Id,
                name = c.Name,
                slug = c.Slug,
                status = c.Status
            })
            .ToListAsync();

        return ApiResponseFactory.Ok(categories, HttpContext);
    }

    // Admin & Public: GET /api/v1/admin/blogs/{id:long}
    [HttpGet("/api/v1/admin/blogs/{id:long}")]
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetBlogById(long id)
    {
        var blog = await _dbContext.Blogs
            .Include(b => b.Category)
            .Include(b => b.Translations)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (blog == null)
            return NotFound(new { message = "Blog not found" });

        var translations = blog.Translations?
            .Select(t => new BlogTranslationDto(t.Lang, t.Title, t.Content, t.AppContent))
            .ToList() ?? new List<BlogTranslationDto>();

        var result = new
        {
            id = blog.Id,
            title = blog.Title,
            slug = blog.Slug,
            image = blog.Image,
            imageUrl = blog.Image,
            bannerImage = blog.Image,
            thumbnail = blog.Image,
            featuredImage = blog.Image,
            coverImage = blog.Image,
            categoryId = blog.CategoryId,
            categoryName = blog.Category?.Name,
            category = blog.Category != null ? new { id = blog.Category.Id, name = blog.Category.Name } : null,
            content = blog.Content,
            appContent = blog.AppContent,
            metaKeywords = blog.MetaKeywords,
            metaDescription = blog.MetaDescription,
            status = blog.Status,
            createdAt = blog.CreatedAt,
            updatedAt = blog.UpdatedAt,
            translations
        };

        if (Request.Path.Value?.Contains("/admin/") == true)
        {
            return ApiResponseFactory.Ok(result, HttpContext);
        }

        return Ok(result);
    }

    // Public: GET /api/v1/blogs/{slug}
    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBlogBySlug(string slug)
    {
        if (long.TryParse(slug, out var id))
        {
            return await GetBlogById(id);
        }

        var cacheKey = $"blog:{slug}";
        var cached = await _redis.StringGetAsync(cacheKey);
        if (!cached.IsNullOrEmpty)
        {
            var cachedBlog = JsonSerializer.Deserialize<BlogDetailDto>((string)cached!);
            return Ok(cachedBlog);
        }

        var blog = await _dbContext.Blogs
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
            blog.MetaDescription, blog.CreatedAt, translations);

        await _redis.StringSetAsync(cacheKey, JsonSerializer.Serialize(result), TimeSpan.FromHours(24));

        return Ok(result);
    }

    // Admin: POST /api/v1/admin/blogs
    [HttpPost("/api/v1/admin/blogs")]
    [Authorize]
    public async Task<IActionResult> CreateBlog([FromBody] CreateBlogRequest request)
    {
        var resolvedImage = request.Image 
            ?? request.ImageUrl 
            ?? request.BannerImage 
            ?? request.Thumbnail 
            ?? request.FeaturedImage 
            ?? request.CoverImage;

        var blog = new Blog
        {
            Title = request.Title,
            Slug = !string.IsNullOrWhiteSpace(request.Slug) ? request.Slug : Guid.NewGuid().ToString().Substring(0, 8),
            CategoryId = request.CategoryId > 0 ? request.CategoryId : null,
            Content = request.Content,
            AppContent = request.AppContent,
            Image = resolvedImage,
            MetaKeywords = request.MetaKeywords,
            MetaDescription = request.MetaDescription,
            Status = request.Status ?? true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Blogs.Add(blog);
        await _dbContext.SaveChangesAsync();

        return ApiResponseFactory.Created(new 
        { 
            id = blog.Id, 
            slug = blog.Slug, 
            title = blog.Title,
            image = blog.Image,
            imageUrl = blog.Image
        }, HttpContext);
    }

    // Admin: PUT /api/v1/admin/blogs/{id}
    [HttpPut("/api/v1/admin/blogs/{id}")]
    [HttpPost("/api/v1/admin/blogs/{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateBlog(long id, [FromBody] UpdateBlogRequest request)
    {
        var blog = await _dbContext.Blogs.FindAsync(id);
        if (blog == null)
            return NotFound(new { message = "Blog not found" });

        var resolvedImage = request.Image 
            ?? request.ImageUrl 
            ?? request.BannerImage 
            ?? request.Thumbnail 
            ?? request.FeaturedImage 
            ?? request.CoverImage;

        blog.Title = request.Title ?? blog.Title;
        blog.Slug = request.Slug ?? blog.Slug;
        if (request.CategoryId.HasValue) blog.CategoryId = request.CategoryId.Value > 0 ? request.CategoryId : null;
        blog.Content = request.Content ?? blog.Content;
        blog.AppContent = request.AppContent ?? blog.AppContent;
        if (resolvedImage != null) blog.Image = resolvedImage;
        blog.MetaKeywords = request.MetaKeywords ?? blog.MetaKeywords;
        blog.MetaDescription = request.MetaDescription ?? blog.MetaDescription;
        if (request.Status.HasValue) blog.Status = request.Status.Value;
        blog.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        // Invalidate cache
        if (!string.IsNullOrEmpty(blog.Slug))
        {
            await _redis.KeyDeleteAsync($"blog:{blog.Slug}");
        }

        return ApiResponseFactory.Ok(new 
        { 
            id = blog.Id, 
            title = blog.Title, 
            slug = blog.Slug, 
            image = blog.Image,
            imageUrl = blog.Image,
            message = "Blog updated successfully" 
        }, HttpContext);
    }

    // Admin: DELETE /api/v1/admin/blogs/{id}
    [HttpDelete("/api/v1/admin/blogs/{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteBlog(long id)
    {
        var blog = await _dbContext.Blogs.FindAsync(id);
        if (blog == null)
            return NotFound(new { message = "Blog not found" });

        blog.Status = false;
        blog.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        if (!string.IsNullOrEmpty(blog.Slug))
        {
            await _redis.KeyDeleteAsync($"blog:{blog.Slug}");
        }

        return ApiResponseFactory.Ok(new { success = true, message = "Blog deleted" }, HttpContext);
    }

    // Admin: POST /api/v1/admin/blogs/{id}/translations
    [HttpPost("/api/v1/admin/blogs/{id}/translations")]
    [Authorize]
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

        return ApiResponseFactory.Created(new { message = "Translation added" }, HttpContext);
    }

    public record BlogDto(long Id, string Title, string Slug, string? Image, DateTime? CreatedAt);
    public record BlogDetailDto(
        long Id, string Title, string Slug, string? Image,
        string? Content, string? AppContent, string? MetaKeywords,
        string? MetaDescription, DateTime? CreatedAt,
        List<BlogTranslationDto> Translations);
    public record BlogTranslationDto(string? Lang, string? Title, string? Content, string? AppContent);
    public record CreateBlogRequest(
        string Title, string? Slug, long? CategoryId, string? Content,
        string? AppContent, string? Image, string? ImageUrl, string? BannerImage,
        string? Thumbnail, string? FeaturedImage, string? CoverImage,
        string? MetaKeywords, string? MetaDescription, bool? Status);
    public record UpdateBlogRequest(
        string? Title, string? Slug, long? CategoryId, string? Content,
        string? AppContent, string? Image, string? ImageUrl, string? BannerImage,
        string? Thumbnail, string? FeaturedImage, string? CoverImage,
        string? MetaKeywords, string? MetaDescription, bool? Status);
    public record AddTranslationRequest(string Lang, string Title, string Content, string? AppContent);
}
