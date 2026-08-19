namespace OneWeb.Domain.Interfaces;

public interface ISslCommerzService
{
    /// <summary>Open a hosted checkout session and return the page to redirect to.</summary>
    Task<SslCommerzSessionResult> InitiateSessionAsync(SslCommerzSessionRequest request, CancellationToken cancellationToken = default);

    /// <summary>Server-side validation of a completed payment, keyed by val_id.</summary>
    Task<SslCommerzValidationResult> ValidatePaymentAsync(string validationId, CancellationToken cancellationToken = default);

    /// <summary>Look a transaction up by our own tran_id (or the gateway session key).</summary>
    Task<SslCommerzValidationResult> QueryTransactionAsync(string? transactionId, string? sessionKey, CancellationToken cancellationToken = default);

    Task<SslCommerzRefundResult> RefundAsync(string bankTransactionId, double amount, string? reason, CancellationToken cancellationToken = default);

    /// <summary>
    /// Verify the MD5 signature SSLCommerz attaches to genuine IPN callbacks.
    /// Browser return URLs do not carry one.
    /// </summary>
    bool VerifyIpnSignature(IReadOnlyDictionary<string, string> formFields);
}

public record SslCommerzSessionRequest(
    string TransactionId,
    double Amount,
    string CustomerName,
    string CustomerPhone,
    string? CustomerEmail,
    string? CustomerAddress,
    string? CustomerCity,
    string? CustomerPostcode,
    string ProductName,
    string ProductCategory,
    long OrderId,
    long UserId,
    /// <summary>Base URL SSLCommerz posts its callbacks back to (this API).</summary>
    string CallbackBaseUrl);

public record SslCommerzSessionResult(
    bool Success,
    string? GatewayPageUrl,
    string? SessionKey,
    string? TransactionId,
    string? Status,
    string? Message);

public record SslCommerzValidationResult(
    bool Success,
    string Status,
    string? TransactionId,
    string? ValidationId,
    string? BankTransactionId,
    double? Amount,
    string? Currency,
    string? CardType,
    string? CardIssuer,
    string? RiskLevel,
    string? Message)
{
    /// <summary>SSLCommerz reports VALID / VALIDATED for a settled payment.</summary>
    public bool IsPaid =>
        Success &&
        (string.Equals(Status, "VALID", StringComparison.OrdinalIgnoreCase) ||
         string.Equals(Status, "VALIDATED", StringComparison.OrdinalIgnoreCase));
}

public record SslCommerzRefundResult(bool Success, string Status, string? RefundRefId, string? Message);
