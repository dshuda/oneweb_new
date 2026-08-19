using Microsoft.Extensions.Options;
using StackExchange.Redis;
using OneWeb.Domain.Auth;
using OneWeb.Domain.Interfaces;

namespace OneWeb.Infrastructure.Services;

public class OtpService : IOtpService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly MasterAuthOptions _master;

    public OtpService(IConnectionMultiplexer redis, IOptions<MasterAuthOptions> master)
    {
        _redis = redis;
        _master = master.Value;
    }

    public async Task<string> GenerateAndSaveOtpAsync(string phone)
    {
        // The master number always gets the fixed bootstrap OTP so the site can
        // be signed into without a working SMS gateway.
        var otp = _master.IsMasterPhone(phone)
            ? _master.Otp
            : Random.Shared.Next(100000, 999999).ToString();

        var db = _redis.GetDatabase();
        var key = $"otp:{phone}";

        await db.StringSetAsync(key, otp, TimeSpan.FromMinutes(5));
        return otp;
    }

    public async Task<bool> ValidateOtpAsync(string phone, string otp)
    {
        // Master OTP short-circuits Redis entirely — it never expires and is
        // not consumed, so repeated logins keep working.
        if (_master.IsMasterOtp(phone, otp))
            return true;

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
