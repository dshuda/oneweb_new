namespace OneWeb.Domain.Interfaces;

/// <summary>
/// Guards the unauthenticated send-otp endpoint. Every call costs an SMS and
/// rings someone's phone, so it needs limiting per number and per caller.
/// </summary>
public interface IOtpRateLimiter
{
    Task<OtpRateLimitResult> TryAcquireAsync(string phone, string? ipAddress, CancellationToken cancellationToken = default);
}

/// <param name="RetryAfterSeconds">How long the caller should wait, when known.</param>
public record OtpRateLimitResult(bool Allowed, string? Reason, int RetryAfterSeconds = 0)
{
    public static OtpRateLimitResult Ok() => new(true, null);
    public static OtpRateLimitResult Deny(string reason, int retryAfter = 0) => new(false, reason, retryAfter);
}

public class OtpRateLimitOptions
{
    public const string SectionName = "OtpRateLimit";

    public bool Enabled { get; set; } = true;

    /// <summary>Minimum gap between two codes for the same number.</summary>
    public int CooldownSeconds { get; set; } = 60;

    /// <summary>Codes allowed per number per hour.</summary>
    public int PerPhonePerHour { get; set; } = 5;

    /// <summary>Codes allowed per number per day.</summary>
    public int PerPhonePerDay { get; set; } = 15;

    /// <summary>Codes allowed per source IP per hour — blunts bulk SMS abuse.</summary>
    public int PerIpPerHour { get; set; } = 20;
}
