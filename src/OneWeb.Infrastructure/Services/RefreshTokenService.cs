using StackExchange.Redis;
using Microsoft.Extensions.Configuration;
using System.Text;
using OneWeb.Domain.Interfaces;

namespace OneWeb.Infrastructure.Services;

public class RefreshTokenService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IConfiguration _config;
    
    public RefreshTokenService(IConnectionMultiplexer redis, IConfiguration config)
    {
        _redis = redis;
        _config = config;
    }
    
    public async Task SaveRefreshTokenAsync(long userId, string token)
    {
        var db = _redis.GetDatabase();
        var key = $"refresh_token:{userId}:{HashToken(token)}";
        var expiry = TimeSpan.FromDays(double.Parse(_config["Jwt:RefreshTokenExpiryDays"]!));
        
        await db.StringSetAsync(key, userId.ToString(), expiry);
    }
    
    public async Task<bool> ValidateAndRevokeAsync(long userId, string token)
    {
        var db = _redis.GetDatabase();
        var key = $"refresh_token:{userId}:{HashToken(token)}";
        
        var value = await db.StringGetAsync(key);
        if (!value.HasValue || value != userId.ToString())
            return false;
        
        await db.KeyDeleteAsync(key);
        return true;
    }
    
    public async Task RevokeAllUserTokensAsync(long userId)
    {
        var server = _redis.GetServer(_redis.GetEndPoints().First());
        var keys = server.Keys(pattern: $"refresh_token:{userId}:*");
        
        foreach (var key in keys)
        {
            await _redis.GetDatabase().KeyDeleteAsync(key);
        }
    }
    
    private string HashToken(string token)
    {
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(token);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash)[..8]; // Use first 8 chars of hash
    }
}
