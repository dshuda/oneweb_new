using System.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Api.DTOs;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api.Controllers;

[ApiController]
[Route("api/v1/pages")]
public class PagesController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public PagesController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("{link}")]
    public async Task<IActionResult> GetByLink(string link)
    {
        var conn = _dbContext.Database.GetDbConnection();
        await _dbContext.Database.OpenConnectionAsync();

        try
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT id, title, slug, link, type, content, status, meta_title, meta_description, meta_keywords, created_at, updated_at FROM pages WHERE link = @link AND status = true LIMIT 1";
            var p = cmd.CreateParameter();
            p.ParameterName = "@link";
            p.Value = link;
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
}
