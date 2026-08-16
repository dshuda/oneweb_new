using StackExchange.Redis;
using OneWeb.Domain.Interfaces;

namespace OneWeb.Infrastructure.Services;

public class OtpService : IOtpService
{
    private readonly IConnectionMultiplexer _redis;
    
    public OtpService(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }
    
    public async Task<string> GenerateAndSaveOtpAsync(string phone)
    {
        // var otp = Random.Shared.Next(100000, 999999).ToString();
        var otp = Random.Shared.Next(100000, 999999).ToString();
        // var otp = "111111";
        var db = _redis.GetDatabase();
        var key = $"otp:{phone}";
        
        await db.StringSetAsync(key, otp, TimeSpan.FromMinutes(5));
        return otp;
    }
    
    public async Task<bool> ValidateOtpAsync(string phone, string otp)
    {
        var db = _redis.GetDatabase();
        var key = $"otp:{phone}";
        
        var savedOtp = await db.StringGetAsync(key);
        if (!savedOtp.HasValue || !string.Equals(savedOtp.ToString(), otp, StringComparison.OrdinalIgnoreCase))
            return false;
        
        // OTP is valid, delete it
        await db.KeyDeleteAsync(key);
        return true;
    }
}
