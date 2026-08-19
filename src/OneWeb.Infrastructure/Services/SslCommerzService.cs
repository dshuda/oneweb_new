using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OneWeb.Domain.Interfaces;
using OneWeb.Domain.Payments;

namespace OneWeb.Infrastructure.Services;

/// <summary>
/// SSLCommerz hosted-checkout client.
///
/// Endpoint quirks that are easy to get wrong:
///  - Session init is POST form-encoded, and its path is version-specific (v3/v4).
///  - Validation, transaction query and refund are GET. Calling them with POST
///    returns HTTP 500.
///  - Response field casing is inconsistent (GatewayPageURL vs gatewayPageURL,
///    sessionkey vs sessionKey), so reads go through a case-tolerant lookup.
/// </summary>
public class SslCommerzService : ISslCommerzService
{
    private readonly HttpClient _httpClient;
    private readonly SslCommerzOptions _options;
    private readonly ILogger<SslCommerzService> _logger;

    public SslCommerzService(
        HttpClient httpClient,
        IOptions<SslCommerzOptions> options,
        ILogger<SslCommerzService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;

        if (_options.TimeoutSeconds > 0)
            _httpClient.Timeout = TimeSpan.FromSeconds(_options.TimeoutSeconds);
    }

    public async Task<SslCommerzSessionResult> InitiateSessionAsync(
        SslCommerzSessionRequest request, CancellationToken cancellationToken = default)
    {
        if (!_options.IsConfigured)
            return new SslCommerzSessionResult(false, null, null, null, null, "SSLCommerz is not configured");

        // Configured PublicBaseUrl wins (proxy/tunnel); otherwise the caller
        // passes the address the request actually arrived on.
        var callbackBase = (string.IsNullOrWhiteSpace(_options.PublicBaseUrl)
            ? request.CallbackBaseUrl
            : _options.PublicBaseUrl).TrimEnd('/');

        var form = new Dictionary<string, string>
        {
            ["store_id"] = _options.StoreId,
            ["store_passwd"] = _options.StorePassword,
            ["total_amount"] = FormatMoney(request.Amount),
            ["currency"] = _options.Currency,
            ["tran_id"] = request.TransactionId,
            ["success_url"] = $"{callbackBase}/api/v1/payments/sslcommerz/success",
            ["fail_url"] = $"{callbackBase}/api/v1/payments/sslcommerz/fail",
            ["cancel_url"] = $"{callbackBase}/api/v1/payments/sslcommerz/cancel",
            ["ipn_url"] = $"{callbackBase}/api/v1/payments/sslcommerz/ipn",
            ["cus_name"] = Fallback(request.CustomerName, "OneTap Customer"),
            ["cus_email"] = Fallback(request.CustomerEmail, "noreply@onetapservice.com"),
            ["cus_phone"] = request.CustomerPhone,
            ["cus_add1"] = Fallback(request.CustomerAddress, "N/A"),
            ["cus_city"] = Fallback(request.CustomerCity, "Dhaka"),
            ["cus_postcode"] = Fallback(request.CustomerPostcode, "1000"),
            ["cus_country"] = "Bangladesh",
            ["shipping_method"] = "NO",
            ["product_name"] = Fallback(request.ProductName, "Service booking"),
            ["product_category"] = Fallback(request.ProductCategory, "Service"),
            ["product_profile"] = "general",
            // value_a..value_d are echoed back on every callback.
            ["value_a"] = request.OrderId.ToString(CultureInfo.InvariantCulture),
            ["value_b"] = request.UserId.ToString(CultureInfo.InvariantCulture),
            ["value_c"] = request.TransactionId
        };

        try
        {
            var payload = await PostFormAsync(_options.SessionEndpoint, form, cancellationToken);
            var status = Read(payload, "status");

            if (!LooksSuccessful(status))
            {
                var reason = Read(payload, "failedreason") ?? Read(payload, "failed_reason") ?? status;
                _logger.LogError(
                    "SSLCommerz session init failed for tran {TranId}: {Reason}",
                    request.TransactionId, reason);
                return new SslCommerzSessionResult(false, null, null, request.TransactionId, status, reason);
            }

            var gatewayUrl = Read(payload, "GatewayPageURL") ?? Read(payload, "gatewayPageURL");
            if (string.IsNullOrWhiteSpace(gatewayUrl))
                return new SslCommerzSessionResult(false, null, null, request.TransactionId, status, "Gateway returned no redirect URL");

            return new SslCommerzSessionResult(
                true,
                gatewayUrl,
                Read(payload, "sessionkey") ?? Read(payload, "sessionKey"),
                request.TransactionId,
                status,
                "Session created");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SSLCommerz session init threw for tran {TranId}", request.TransactionId);
            return new SslCommerzSessionResult(false, null, null, request.TransactionId, null, ex.Message);
        }
    }

    public async Task<SslCommerzValidationResult> ValidatePaymentAsync(
        string validationId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(validationId))
            return Invalid("A validation id (val_id) is required");

        var query = new Dictionary<string, string>
        {
            ["val_id"] = validationId,
            ["store_id"] = _options.StoreId,
            ["store_passwd"] = _options.StorePassword,
            ["v"] = "1",
            ["format"] = "json"
        };

        try
        {
            // GET, not POST — the validation endpoint 500s on POST.
            var payload = await GetFormAsync(_options.ValidationEndpoint, query, cancellationToken);
            return FromPayload(payload);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SSLCommerz validation threw for val_id {ValId}", validationId);
            return Invalid(ex.Message);
        }
    }

    public async Task<SslCommerzValidationResult> QueryTransactionAsync(
        string? transactionId, string? sessionKey, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(transactionId) && string.IsNullOrWhiteSpace(sessionKey))
            return Invalid("A transaction id or session key is required");

        var query = new Dictionary<string, string>
        {
            ["store_id"] = _options.StoreId,
            ["store_passwd"] = _options.StorePassword,
            ["v"] = "1",
            ["format"] = "json"
        };
        if (!string.IsNullOrWhiteSpace(transactionId)) query["tran_id"] = transactionId!;
        if (!string.IsNullOrWhiteSpace(sessionKey)) query["sessionkey"] = sessionKey!;

        try
        {
            var payload = await GetFormAsync(_options.TransactionQueryEndpoint, query, cancellationToken);
            return FromPayload(payload);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SSLCommerz query threw for tran {TranId}", transactionId);
            return Invalid(ex.Message);
        }
    }

    public async Task<SslCommerzRefundResult> RefundAsync(
        string bankTransactionId, double amount, string? reason, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(bankTransactionId))
            return new SslCommerzRefundResult(false, "FAILED", null, "A bank transaction id is required");

        // Field is "refe_id", not "refund_trans_id" — and this endpoint is GET too.
        var query = new Dictionary<string, string>
        {
            ["bank_tran_id"] = bankTransactionId,
            ["refe_id"] = Guid.NewGuid().ToString("N"),
            ["refund_amount"] = FormatMoney(amount),
            ["refund_remarks"] = Fallback(reason, "Refund initiated"),
            ["store_id"] = _options.StoreId,
            ["store_passwd"] = _options.StorePassword,
            ["v"] = "1",
            ["format"] = "json"
        };

        try
        {
            var payload = await GetFormAsync(_options.RefundEndpoint, query, cancellationToken);
            var status = (Read(payload, "status") ?? string.Empty).ToUpperInvariant();
            return new SslCommerzRefundResult(
                LooksSuccessful(status),
                status,
                Read(payload, "refund_ref_id"),
                Read(payload, "errorReason") ?? Read(payload, "status"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SSLCommerz refund threw for bank tran {BankTranId}", bankTransactionId);
            return new SslCommerzRefundResult(false, "FAILED", null, ex.Message);
        }
    }

    /// <summary>
    /// SSLCommerz signs genuine IPN payloads with an MD5 hash:
    ///   1. verify_key lists the POST fields that take part
    ///   2. MD5(store password) is added as a synthetic "store_passwd" field
    ///   3. fields are sorted by key and joined as "k=v&amp;k2=v2"
    ///   4. MD5 of that string must equal verify_sign
    /// Only the fields named in verify_key participate — hashing every POST
    /// field makes real callbacks fail.
    /// </summary>
    public bool VerifyIpnSignature(IReadOnlyDictionary<string, string> formFields)
    {
        if (!formFields.TryGetValue("verify_sign", out var receivedSign) || string.IsNullOrWhiteSpace(receivedSign))
        {
            _logger.LogWarning("SSLCommerz IPN rejected: verify_sign missing");
            return false;
        }

        if (!formFields.TryGetValue("verify_key", out var verifyKey) || string.IsNullOrWhiteSpace(verifyKey))
        {
            _logger.LogWarning("SSLCommerz IPN rejected: verify_key missing");
            return false;
        }

        var fields = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["store_passwd"] = Md5Hex(_options.StorePassword)
        };

        foreach (var rawKey in verifyKey.Split(',', StringSplitOptions.RemoveEmptyEntries))
        {
            var key = rawKey.Trim();
            if (key.Length == 0) continue;
            if (formFields.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value))
                fields[key] = value.Trim();
        }

        var canonical = string.Join(
            "&",
            fields.OrderBy(pair => pair.Key, StringComparer.Ordinal)
                  .Select(pair => $"{pair.Key}={pair.Value}"));

        var computed = Md5Hex(canonical);
        if (!string.Equals(computed, receivedSign.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning(
                "SSLCommerz IPN signature mismatch: computed={Computed} received={Received}",
                computed, receivedSign);
            return false;
        }

        return true;
    }

    /* ------------------------------------------------------------ transport -- */

    private async Task<Dictionary<string, string>> PostFormAsync(
        string endpoint, Dictionary<string, string> values, CancellationToken cancellationToken)
    {
        using var content = new FormUrlEncodedContent(values);
        using var response = await _httpClient.PostAsync(endpoint, content, cancellationToken);
        return await ReadPayloadAsync(response, cancellationToken);
    }

    private async Task<Dictionary<string, string>> GetFormAsync(
        string endpoint, Dictionary<string, string> values, CancellationToken cancellationToken)
    {
        using var query = new FormUrlEncodedContent(values);
        var queryString = await query.ReadAsStringAsync(cancellationToken);
        using var response = await _httpClient.GetAsync($"{endpoint}?{queryString}", cancellationToken);
        return await ReadPayloadAsync(response, cancellationToken);
    }

    private static async Task<Dictionary<string, string>> ReadPayloadAsync(
        HttpResponseMessage response, CancellationToken cancellationToken)
    {
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
            throw new HttpRequestException($"SSLCommerz returned HTTP {(int)response.StatusCode}: {Trim(body)}");

        using var document = JsonDocument.Parse(body);
        var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        if (document.RootElement.ValueKind != JsonValueKind.Object)
            return result;

        foreach (var property in document.RootElement.EnumerateObject())
        {
            result[property.Name] = property.Value.ValueKind switch
            {
                JsonValueKind.String => property.Value.GetString() ?? string.Empty,
                JsonValueKind.Null or JsonValueKind.Undefined => string.Empty,
                _ => property.Value.ToString()
            };
        }

        return result;
    }

    /* -------------------------------------------------------------- helpers -- */

    private static SslCommerzValidationResult FromPayload(Dictionary<string, string> payload)
    {
        var status = (Read(payload, "status") ?? string.Empty).ToUpperInvariant();

        return new SslCommerzValidationResult(
            Success: !string.IsNullOrEmpty(status),
            Status: status,
            TransactionId: Read(payload, "tran_id") ?? Read(payload, "transaction_id"),
            ValidationId: Read(payload, "val_id") ?? Read(payload, "validation_id"),
            BankTransactionId: Read(payload, "bank_tran_id"),
            Amount: ParseMoney(Read(payload, "amount")),
            Currency: Read(payload, "currency"),
            CardType: Read(payload, "card_type"),
            CardIssuer: Read(payload, "card_issuer"),
            RiskLevel: Read(payload, "risk_level"),
            Message: Read(payload, "error") ?? Read(payload, "status"));
    }

    private static SslCommerzValidationResult Invalid(string message) =>
        new(false, "FAILED", null, null, null, null, null, null, null, null, message);

    private static string? Read(Dictionary<string, string> payload, string key) =>
        payload.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value) ? value : null;

    private static bool LooksSuccessful(string? status) =>
        status?.Trim().ToUpperInvariant() switch
        {
            "SUCCESS" or "VALID" or "VALIDATED" or "INITIATED" => true,
            _ => false
        };

    private static double? ParseMoney(string? value) =>
        double.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsed) ? parsed : null;

    private static string FormatMoney(double value) =>
        value.ToString("F2", CultureInfo.InvariantCulture);

    private static string Fallback(string? value, string fallback) =>
        string.IsNullOrWhiteSpace(value) ? fallback : value;

    private static string Md5Hex(string input) =>
        Convert.ToHexString(MD5.HashData(Encoding.UTF8.GetBytes(input))).ToLowerInvariant();

    private static string Trim(string body) =>
        body.Length <= 200 ? body : body[..200];
}
