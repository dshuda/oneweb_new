using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;
using System.Text.Json;

namespace OneWeb.Api.Controllers;

[ApiController]
[Route("api/v1/settings")]
public class SettingsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly StackExchange.Redis.IDatabase _redis;

    public SettingsController(AppDbContext dbContext, StackExchange.Redis.IConnectionMultiplexer redis)
    {
        _dbContext = dbContext;
        _redis = redis.GetDatabase();
    }

    // Public: GET /api/v1/settings
    [HttpGet()]
    public async Task<IActionResult> GetSettings()
    {
        const string cacheKey = "business_settings";
        var cached = await _redis.StringGetAsync(cacheKey);
        
        if (!cached.IsNullOrEmpty)
        {
            var settings = JsonSerializer.Deserialize<Dictionary<string, string>>((string)cached!);
            return Ok(settings);
        }

        var settingsList = await _dbContext.BusinessSettings.ToListAsync();
        var result = settingsList.ToDictionary(s => s.Type, s => s.Value ?? "");

        await _redis.StringSetAsync(cacheKey, JsonSerializer.Serialize(result), TimeSpan.FromHours(24));

        return Ok(result);
    }

    // Admin: PUT /api/v1/admin/settings
    [HttpPut()]
    [Route("/api/v1/admin/settings")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> UpdateSettings([FromBody] List<UpdateSettingRequest> request)
    {
        foreach (var item in request)
        {
            var setting = await _dbContext.BusinessSettings
                .FirstOrDefaultAsync(s => s.Type == item.Type && s.Lang == item.Lang);

            if (setting != null)
            {
                setting.Value = item.Value;
                setting.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _dbContext.BusinessSettings.Add(new BusinessSetting
                {
                    Type = item.Type,
                    Value = item.Value,
                    Lang = item.Lang,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
        }

        await _dbContext.SaveChangesAsync();

        // Invalidate cache
        await _redis.KeyDeleteAsync("business_settings");

        return Ok(new { message = "Settings updated" });
    }

    public record UpdateSettingRequest(string Type, string Value, string? Lang);
}
