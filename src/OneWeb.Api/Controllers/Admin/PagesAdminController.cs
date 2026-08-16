using System.Data;
using System.Data.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Api.DTOs;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/pages")]
[Authorize(Roles = "admin,staff")]
public class PagesAdminController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public PagesAdminController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var conn = _dbContext.Database.GetDbConnection();
        await _dbContext.Database.OpenConnectionAsync();

        try
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT id, title, slug, link, type, content, status, meta_title, meta_description, meta_keywords, created_at, updated_at FROM pages ORDER BY id ASC";
            
            using var reader = await cmd.ExecuteReaderAsync();
            var pages = new List<object>();

            while (await reader.ReadAsync())
            {
                pages.Add(new
                {
                    id = reader.GetInt64(0),
                    title = reader.IsDBNull(1) ? "" : reader.GetString(1),
                    slug = reader.IsDBNull(2) ? "" : reader.GetString(2),
                    link = reader.IsDBNull(3) ? "" : reader.GetString(3),
                    type = reader.IsDBNull(4) ? "web" : reader.GetString(4),
                    content = reader.IsDBNull(5) ? "" : reader.GetString(5),
                    status = !reader.IsDBNull(6) && reader.GetBoolean(6),
                    metaTitle = reader.IsDBNull(7) ? null : reader.GetString(7),
                    metaDescription = reader.IsDBNull(8) ? null : reader.GetString(8),
                    metaKeywords = reader.IsDBNull(9) ? null : reader.GetString(9),
                    createdAt = reader.IsDBNull(10) ? (DateTime?)null : reader.GetDateTime(10),
                    updatedAt = reader.IsDBNull(11) ? (DateTime?)null : reader.GetDateTime(11)
                });
            }

            return ApiResponseFactory.Ok(pages, HttpContext);
        }
        finally
        {
            await _dbContext.Database.CloseConnectionAsync();
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(long id)
    {
        var conn = _dbContext.Database.GetDbConnection();
        await _dbContext.Database.OpenConnectionAsync();

        try
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT id, title, slug, link, type, content, status, meta_title, meta_description, meta_keywords, created_at, updated_at FROM pages WHERE id = @id LIMIT 1";
            var p = cmd.CreateParameter();
            p.ParameterName = "@id";
            p.Value = id;
            cmd.Parameters.Add(p);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                var page = new
                {
                    id = reader.GetInt64(0),
                    title = reader.IsDBNull(1) ? "" : reader.GetString(1),
                    slug = reader.IsDBNull(2) ? "" : reader.GetString(2),
                    link = reader.IsDBNull(3) ? "" : reader.GetString(3),
                    type = reader.IsDBNull(4) ? "web" : reader.GetString(4),
                    content = reader.IsDBNull(5) ? "" : reader.GetString(5),
                    status = !reader.IsDBNull(6) && reader.GetBoolean(6),
                    metaTitle = reader.IsDBNull(7) ? null : reader.GetString(7),
                    metaDescription = reader.IsDBNull(8) ? null : reader.GetString(8),
                    metaKeywords = reader.IsDBNull(9) ? null : reader.GetString(9),
                    createdAt = reader.IsDBNull(10) ? (DateTime?)null : reader.GetDateTime(10),
                    updatedAt = reader.IsDBNull(11) ? (DateTime?)null : reader.GetDateTime(11)
                };

                return ApiResponseFactory.Ok(page, HttpContext);
            }

            return NotFound();
        }
        finally
        {
            await _dbContext.Database.CloseConnectionAsync();
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PageRequest request)
    {
        var conn = _dbContext.Database.GetDbConnection();
        await _dbContext.Database.OpenConnectionAsync();

        try
        {
            // Check link uniqueness
            using var checkCmd = conn.CreateCommand();
            checkCmd.CommandText = "SELECT COUNT(*) FROM pages WHERE link = @link";
            var pLink = checkCmd.CreateParameter();
            pLink.ParameterName = "@link";
            pLink.Value = request.Link;
            checkCmd.Parameters.Add(pLink);

            var count = Convert.ToInt64(await checkCmd.ExecuteScalarAsync());
            if (count > 0)
            {
                return Conflict(new { message = $"The link '{request.Link}' is already used by another page." });
            }

            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"INSERT INTO pages (title, slug, link, type, content, status, meta_title, meta_description, meta_keywords, created_at, updated_at) 
                                VALUES (@title, @slug, @link, @type, @content, @status, @meta_title, @meta_description, @meta_keywords, NOW(), NOW()) 
                                RETURNING id;";

            cmd.Parameters.Add(CreateParam(cmd, "@title", request.Title));
            cmd.Parameters.Add(CreateParam(cmd, "@slug", request.Slug ?? request.Link));
            cmd.Parameters.Add(CreateParam(cmd, "@link", request.Link));
            cmd.Parameters.Add(CreateParam(cmd, "@type", request.Type ?? "web"));
            cmd.Parameters.Add(CreateParam(cmd, "@content", request.Content ?? ""));
            cmd.Parameters.Add(CreateParam(cmd, "@status", request.Status));
            cmd.Parameters.Add(CreateParam(cmd, "@meta_title", (object?)request.MetaTitle ?? DBNull.Value));
            cmd.Parameters.Add(CreateParam(cmd, "@meta_description", (object?)request.MetaDescription ?? DBNull.Value));
            cmd.Parameters.Add(CreateParam(cmd, "@meta_keywords", (object?)request.MetaKeywords ?? DBNull.Value));

            var newId = Convert.ToInt64(await cmd.ExecuteScalarAsync());
            return ApiResponseFactory.Ok(new { id = newId, message = "Page created." }, HttpContext);
        }
        finally
        {
            await _dbContext.Database.CloseConnectionAsync();
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(long id, [FromBody] PageRequest request)
    {
        var conn = _dbContext.Database.GetDbConnection();
        await _dbContext.Database.OpenConnectionAsync();

        try
        {
            // Check link uniqueness excluding current id
            using var checkCmd = conn.CreateCommand();
            checkCmd.CommandText = "SELECT COUNT(*) FROM pages WHERE link = @link AND id <> @id";
            var pLink = checkCmd.CreateParameter();
            pLink.ParameterName = "@link";
            pLink.Value = request.Link;
            checkCmd.Parameters.Add(pLink);
            var pId = checkCmd.CreateParameter();
            pId.ParameterName = "@id";
            pId.Value = id;
            checkCmd.Parameters.Add(pId);

            var count = Convert.ToInt64(await checkCmd.ExecuteScalarAsync());
            if (count > 0)
            {
                return Conflict(new { message = $"The link '{request.Link}' is already used by another page." });
            }

            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"UPDATE pages 
                                SET title = @title, slug = @slug, link = @link, type = @type, content = @content, status = @status, 
                                    meta_title = @meta_title, meta_description = @meta_description, meta_keywords = @meta_keywords, updated_at = NOW() 
                                WHERE id = @id;";

            cmd.Parameters.Add(CreateParam(cmd, "@id", id));
            cmd.Parameters.Add(CreateParam(cmd, "@title", request.Title));
            cmd.Parameters.Add(CreateParam(cmd, "@slug", request.Slug ?? request.Link));
            cmd.Parameters.Add(CreateParam(cmd, "@link", request.Link));
            cmd.Parameters.Add(CreateParam(cmd, "@type", request.Type ?? "web"));
            cmd.Parameters.Add(CreateParam(cmd, "@content", request.Content ?? ""));
            cmd.Parameters.Add(CreateParam(cmd, "@status", request.Status));
            cmd.Parameters.Add(CreateParam(cmd, "@meta_title", (object?)request.MetaTitle ?? DBNull.Value));
            cmd.Parameters.Add(CreateParam(cmd, "@meta_description", (object?)request.MetaDescription ?? DBNull.Value));
            cmd.Parameters.Add(CreateParam(cmd, "@meta_keywords", (object?)request.MetaKeywords ?? DBNull.Value));

            await cmd.ExecuteNonQueryAsync();
            return ApiResponseFactory.Ok(new { id, message = "Page updated." }, HttpContext);
        }
        finally
        {
            await _dbContext.Database.CloseConnectionAsync();
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(long id)
    {
        var conn = _dbContext.Database.GetDbConnection();
        await _dbContext.Database.OpenConnectionAsync();

        try
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "DELETE FROM pages WHERE id = @id";
            var p = cmd.CreateParameter();
            p.ParameterName = "@id";
            p.Value = id;
            cmd.Parameters.Add(p);

            await cmd.ExecuteNonQueryAsync();
            return ApiResponseFactory.Ok(new { message = "Page deleted." }, HttpContext);
        }
        finally
        {
            await _dbContext.Database.CloseConnectionAsync();
        }
    }

    private static DbParameter CreateParam(DbCommand cmd, string name, object value)
    {
        var p = cmd.CreateParameter();
        p.ParameterName = name;
        p.Value = value;
        return p;
    }

    public class PageRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public string Link { get; set; } = string.Empty;
        public string? Type { get; set; }
        public string? Content { get; set; }
        public bool Status { get; set; } = true;
        public string? MetaTitle { get; set; }
        public string? MetaDescription { get; set; }
        public string? MetaKeywords { get; set; }
    }
}
