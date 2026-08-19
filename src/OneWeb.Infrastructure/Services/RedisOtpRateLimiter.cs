using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OneWeb.Domain.Interfaces;
using StackExchange.Redis;

namespace OneWeb.Infrastructure.Services;

/// <summary>
/// Redis-backed limits for send-otp: a cooldown between codes, hourly and daily
/// caps per number, and an hourly cap per source IP.
///
/// Counters are incremented only once a request is allowed, so a rejected call
/// never pushes the caller further into the penalty box.
/// </summary>
public class RedisOtpRateLimiter : IOtpRateLimiter
{
    private readonly IConnectionMultiplexer _redis;
    private readonly OtpRateLimitOptions _options;
    private readonly ILogger<RedisOtpRateLimiter> _logger;

    public RedisOtpRateLimiter(
        IConnectionMultiplexer redis,
        IOptions<OtpRateLimitOptions> options,
        ILogger<RedisOtpRateLimiter> logger)
    {
        _redis = redis;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<OtpRateLimitResult> TryAcquireAsync(
        string phone, string? ipAddress, CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled || string.IsNullOrWhiteSpace(phone))
            return OtpRateLimitResult.Ok();

        try
        {
            var db = _redis.GetDatabase();

            // 1. Cooldown — one code per number per CooldownSeconds.
            var cooldownKey = $"otp:rl:cooldown:{phone}";
            if (await db.KeyExistsAsync(cooldownKey))
            {
                var ttl = await db.KeyTimeToLiveAsync(cooldownKey);
                var wait = (int)Math.Ceiling(ttl?.TotalSeconds ?? _options.CooldownSeconds);
                return OtpRateLimitResult.Deny(
                    $"Please wait {wait} seconds before requesting another code.", wait);
            }

            // 2. Per-number hourly and daily caps.
            var hourKey = $"otp:rl:phone:h:{phone}";
            var dayKey = $"otp:rl:phone:d:{phone}";

            if (await CountAsync(db, hourKey) >= _options.PerPhonePerHour)
                return OtpRateLimitResult.Deny(
                    "Too many codes requested for this number. Please try again later.", 3600);

            if (await CountAsync(db, dayKey) >= _options.PerPhonePerDay)
                return OtpRateLimitResult.Deny(
                    "Daily verification limit reached for this number.", 86400);

            // 3. Per-IP hourly cap — stops one host cycling many numbers.
            string? ipKey = null;
            if (!string.IsNullOrWhiteSpace(ipAddress))
            {
                ipKey = $"otp:rl:ip:{ipAddress}";
                if (await CountAsync(db, ipKey) >= _options.PerIpPerHour)
                {
                    _logger.LogWarning("OTP rate limit hit for IP {Ip}", ipAddress);
                    return OtpRateLimitResult.Deny(
                        "Too many requests. Please try again later.", 3600);
                }
            }

            // Allowed — now record it.
            await db.StringSetAsync(cooldownKey, "1", TimeSpan.FromSeconds(_options.CooldownSeconds));
            await IncrementAsync(db, hourKey, TimeSpan.FromHours(1));
            await IncrementAsync(db, dayKey, TimeSpan.FromDays(1));
            if (ipKey != null) await IncrementAsync(db, ipKey, TimeSpan.FromHours(1));

            return OtpRateLimitResult.Ok();
        }
        catch (Exception ex)
        {
            // Redis being down must not take login offline; the SMS provider's
            // own limits remain as a backstop.
            _logger.LogError(ex, "OTP rate limiter unavailable; allowing the request");
            return OtpRateLimitResult.Ok();
        }
    }

    private static async Task<long> CountAsync(IDatabase db, string key)
    {
        var value = await db.StringGetAsync(key);
        // Cast explicitly: RedisValue converts to both string and ReadOnlySpan<byte>,
        // which makes long.TryParse ambiguous.
        return value.HasValue && long.TryParse(value.ToString(), out var count) ? count : 0;
    }

    /// <summary>INCR then set the TTL only on first write, so the window doesn't slide forever.</summary>
    private static async Task IncrementAsync(IDatabase db, string key, TimeSpan window)
    {
        var count = await db.StringIncrementAsync(key);
        if (count == 1)
            await db.KeyExpireAsync(key, window);
    }
}
