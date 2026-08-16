using OneWeb.Domain.Interfaces;
using StackExchange.Redis;

namespace OneWeb.Infrastructure.Services;

/// <summary>
/// T4.1 — Implements IDashboardCacheService using Redis.
/// Invalidates the dashboard:stats key so the next request fetches fresh data.
/// </summary>
public class DashboardCacheService : IDashboardCacheService
{
    private readonly IDatabase _redis;
    private const string CacheKey = "dashboard:stats";

    public DashboardCacheService(IConnectionMultiplexer redis)
    {
        _redis = redis.GetDatabase();
    }

    public async Task InvalidateStatsAsync()
    {
        await _redis.KeyDeleteAsync(CacheKey);
    }
}
