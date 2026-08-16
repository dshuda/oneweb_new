using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;
using System.Text.Json;

namespace OneWeb.Api.Controllers;

[ApiController]
[Route("api/v1/locations")]
public class LocationsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly StackExchange.Redis.IDatabase _redis;

    public LocationsController(AppDbContext dbContext, StackExchange.Redis.IConnectionMultiplexer redis)
    {
        _dbContext = dbContext;
        _redis = redis.GetDatabase();
    }

    // Public (cached 24hr): GET /api/v1/locations/divisions
    [HttpGet("divisions")]
    public async Task<IActionResult> GetDivisions()
    {
        const string cacheKey = "locations:divisions";
        var cached = await _redis.StringGetAsync(cacheKey);
        
        if (!cached.IsNullOrEmpty)
        {
            var divisions = JsonSerializer.Deserialize<List<DivisionDto>>((string)cached!);
            return Ok(divisions);
        }

        var divisionsList = await _dbContext.Divisions
            .Where(d => d.Status)
            .OrderBy(d => d.Name)
            .Select(d => new DivisionDto(d.Id, d.Name, d.BnName))
            .ToListAsync();

        await _redis.StringSetAsync(cacheKey, JsonSerializer.Serialize(divisionsList), TimeSpan.FromHours(24));

        return Ok(divisionsList);
    }

    // Public (cached 24hr): GET /api/v1/locations/districts?divisionId=X
    [HttpGet("districts")]
    public async Task<IActionResult> GetDistricts([FromQuery] long? divisionId = null)
    {
        var cacheKey = divisionId.HasValue 
            ? $"locations:districts:{divisionId}" 
            : "locations:districts:all";

        var cached = await _redis.StringGetAsync(cacheKey);
        if (!cached.IsNullOrEmpty)
        {
            var districts = JsonSerializer.Deserialize<List<DistrictDto>>((string)cached!);
            return Ok(districts);
        }

        var query = _dbContext.Districts.Where(d => d.Status);
        
        if (divisionId.HasValue)
            query = query.Where(d => d.DivisionId == divisionId);

        var districtsList = await query
            .OrderBy(d => d.Name)
            .Select(d => new DistrictDto(d.Id, d.DivisionId, d.Name, d.BnName))
            .ToListAsync();

        await _redis.StringSetAsync(cacheKey, JsonSerializer.Serialize(districtsList), TimeSpan.FromHours(24));

        return Ok(districtsList);
    }

    // Public (cached 24hr): GET /api/v1/locations/upazilas?districtId=X
    [HttpGet("upazilas")]
    public async Task<IActionResult> GetUpazilas([FromQuery] long? districtId = null)
    {
        var cacheKey = districtId.HasValue 
            ? $"locations:upazilas:{districtId}" 
            : "locations:upazilas:all";

        var cached = await _redis.StringGetAsync(cacheKey);
        if (!cached.IsNullOrEmpty)
        {
            var upazilas = JsonSerializer.Deserialize<List<UpazilaDto>>((string)cached!);
            return Ok(upazilas);
        }

        var query = _dbContext.Upazilas.Where(u => u.Status);
        
        if (districtId.HasValue)
            query = query.Where(u => u.DistrictId == districtId);

        var upazilasList = await query
            .OrderBy(u => u.Name)
            .Select(u => new UpazilaDto(u.Id, u.DistrictId, u.Name, u.BnName))
            .ToListAsync();

        await _redis.StringSetAsync(cacheKey, JsonSerializer.Serialize(upazilasList), TimeSpan.FromHours(24));

        return Ok(upazilasList);
    }

    public record DivisionDto(long Id, string Name, string? BnName);
    public record DistrictDto(long Id, long DivisionId, string Name, string? BnName);
    public record UpazilaDto(long Id, long DistrictId, string Name, string? BnName);
}
