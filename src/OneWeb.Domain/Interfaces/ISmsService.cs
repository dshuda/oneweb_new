namespace OneWeb.Domain.Interfaces;

public interface ISmsService
{
    Task<bool> SendOtpAsync(string phoneNumber, string otp);

    /// <summary>
    /// Send an arbitrary message. <paramref name="useMasking"/> asks for the
    /// branded alphanumeric sender; the provider falls back to the numeric
    /// sender when masking is unavailable.
    /// </summary>
    Task<SmsSendResult> SendAsync(string phoneNumber, string message, bool useMasking = true);
}

/// <param name="Status">PENDING once accepted by the gateway, FAILED otherwise, SKIPPED when SMS is disabled.</param>
/// <param name="ReferenceId">Gateway reference used to correlate delivery reports.</param>
public record SmsSendResult(bool Success, string Status, string? ReferenceId, string? ErrorMessage)
{
    public static SmsSendResult Skipped(string reason) => new(false, "SKIPPED", null, reason);
    public static SmsSendResult Failed(string reason) => new(false, "FAILED", null, reason);
    public static SmsSendResult Accepted(string? referenceId) => new(true, "PENDING", referenceId, null);
}
