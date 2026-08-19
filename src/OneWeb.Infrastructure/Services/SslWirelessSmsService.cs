using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OneWeb.Domain.Interfaces;
using OneWeb.Domain.Sms;

namespace OneWeb.Infrastructure.Services;

/// <summary>
/// SSL Wireless SMS gateway client (SMS Plus v3 JSON API).
///
/// POST {ApiBase}/api/v3/send-sms
///   { api_token, sid, msisdn, sms, sender_id, csms_id }
/// →  { "status":"SUCCESS", "status_code":200, "error_message":"",
///      "smsinfo":[{ "sms_status":"SUCCESS", "reference_id":"..." }] }
///
/// Both the envelope status and the per-message status must read SUCCESS — the
/// gateway returns HTTP 200 with a failed sms_status for rejected numbers.
/// </summary>
public class SslWirelessSmsService : ISmsService
{
    private readonly HttpClient _httpClient;
    private readonly SslWirelessOptions _options;
    private readonly ILogger<SslWirelessSmsService> _logger;

    public SslWirelessSmsService(
        HttpClient httpClient,
        IOptions<SslWirelessOptions> options,
        ILogger<SslWirelessSmsService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;

        if (_options.TimeoutSeconds > 0)
            _httpClient.Timeout = TimeSpan.FromSeconds(_options.TimeoutSeconds);
    }

    public async Task<bool> SendOtpAsync(string phoneNumber, string otp)
    {
        // OTPs go out masked so the branded sender ID is shown.
        var result = await SendAsync(phoneNumber, $"Your OneTap verification code is {otp}. It expires in 5 minutes.");
        return result.Success;
    }

    public async Task<SmsSendResult> SendAsync(string phoneNumber, string message, bool useMasking = true)
    {
        if (!_options.IsConfigured)
        {
            _logger.LogWarning("SSL Wireless is not configured; skipping SMS to {Msisdn}", Mask(phoneNumber));
            return SmsSendResult.Skipped("SSL Wireless is not configured");
        }

        var msisdn = NormalizeMsisdn(phoneNumber);
        if (msisdn == null)
            return SmsSendResult.Failed($"Invalid Bangladeshi mobile number: {phoneNumber}");

        var sender = ResolveSender(useMasking);
        if (sender == null)
            return SmsSendResult.Failed("No SMS sender configured");

        var payload = new
        {
            api_token = _options.ApiToken,
            sid = _options.Sid,
            msisdn,
            sms = message,
            sender_id = sender,
            csms_id = Guid.NewGuid().ToString("N")
        };

        try
        {
            var endpoint = $"{_options.ApiBase.TrimEnd('/')}/api/v3/send-sms";
            using var content = new StringContent(
                JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            using var response = await _httpClient.PostAsync(endpoint, content);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "SSL Wireless returned HTTP {StatusCode} for {Msisdn}: {Body}",
                    (int)response.StatusCode, Mask(msisdn), body);
                return SmsSendResult.Failed($"Gateway returned HTTP {(int)response.StatusCode}");
            }

            return ParseResponse(body, msisdn);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SSL Wireless send failed for {Msisdn}", Mask(msisdn));
            return SmsSendResult.Failed(ex.Message);
        }
    }

    private SmsSendResult ParseResponse(string body, string msisdn)
    {
        try
        {
            using var document = JsonDocument.Parse(body);
            var root = document.RootElement;

            var status = GetString(root, "status");
            if (!string.Equals(status, "SUCCESS", StringComparison.OrdinalIgnoreCase))
            {
                var error = GetString(root, "error_message") ?? status ?? "unknown error";
                _logger.LogError(
                    "SSL Wireless rejected the request for {Msisdn}: status={Status} error={Error}",
                    Mask(msisdn), status, error);
                return SmsSendResult.Failed(error);
            }

            // The envelope can say SUCCESS while an individual message fails.
            if (!root.TryGetProperty("smsinfo", out var smsInfo) ||
                smsInfo.ValueKind != JsonValueKind.Array ||
                smsInfo.GetArrayLength() == 0)
            {
                _logger.LogError("SSL Wireless response carried no smsinfo for {Msisdn}: {Body}", Mask(msisdn), body);
                return SmsSendResult.Failed("Gateway response contained no smsinfo");
            }

            var first = smsInfo[0];
            var smsStatus = GetString(first, "sms_status");
            if (!string.Equals(smsStatus, "SUCCESS", StringComparison.OrdinalIgnoreCase))
            {
                var error = GetString(first, "status_message") ?? smsStatus ?? "unknown error";
                _logger.LogError("SSL Wireless failed to queue SMS for {Msisdn}: {Error}", Mask(msisdn), error);
                return SmsSendResult.Failed(error);
            }

            var referenceId = GetString(first, "reference_id");
            _logger.LogInformation(
                "SSL Wireless accepted SMS for {Msisdn} (reference {ReferenceId})", Mask(msisdn), referenceId);
            return SmsSendResult.Accepted(referenceId);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Could not parse SSL Wireless response: {Body}", body);
            return SmsSendResult.Failed("Unreadable gateway response");
        }
    }

    private string? ResolveSender(bool useMasking)
    {
        if (useMasking && _options.MaskingEnabled && !string.IsNullOrWhiteSpace(_options.MaskingSenderId))
            return _options.MaskingSenderId;

        if (_options.NonMaskingEnabled && !string.IsNullOrWhiteSpace(_options.NonMaskingSender))
            return _options.NonMaskingSender;

        // Masking was requested but non-masking isn't available — use the
        // branded sender anyway rather than dropping the message.
        if (_options.MaskingEnabled && !string.IsNullOrWhiteSpace(_options.MaskingSenderId))
            return _options.MaskingSenderId;

        return null;
    }

    private static string? GetString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var value))
            return null;

        return value.ValueKind switch
        {
            JsonValueKind.String => value.GetString(),
            JsonValueKind.Number => value.ToString(),
            JsonValueKind.Null or JsonValueKind.Undefined => null,
            _ => value.ToString()
        };
    }

    /// <summary>
    /// Normalise to the 8801XXXXXXXXX form the gateway expects.
    /// Accepts +8801XXXXXXXXX, 8801XXXXXXXXX, 01XXXXXXXXX and 1XXXXXXXXX.
    /// </summary>
    public static string? NormalizeMsisdn(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return null;

        var digits = new string(phone.Where(char.IsDigit).ToArray());

        if (digits.StartsWith("880", StringComparison.Ordinal))
            digits = digits[3..];
        else if (digits.StartsWith("0", StringComparison.Ordinal))
            digits = digits[1..];

        // What remains must be 1XXXXXXXXX — 10 digits, operator prefix 3/4/5/6/7/8/9.
        if (digits.Length != 10 || digits[0] != '1' || digits[1] < '3' || digits[1] > '9')
            return null;

        return "880" + digits;
    }

    /// <summary>8801712345678 → 8801XXX***678, for logs.</summary>
    public static string Mask(string? msisdn)
    {
        if (string.IsNullOrWhiteSpace(msisdn) || msisdn.Length < 13)
            return "XXXXXXXXXXXXX";
        return string.Concat(msisdn.AsSpan(0, 4), "XXX***", msisdn.AsSpan(msisdn.Length - 3));
    }
}
