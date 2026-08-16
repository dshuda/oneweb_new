namespace OneWeb.Domain.Interfaces;

public record SslCommerzInitResult(
    bool Success, 
    string? GatewayPageUrl, 
    string? SessionKey, 
    string? TransactionId, 
    string? Message
);

public record SslCommerzValidationResult(
    bool IsValid, 
    string? Status, 
    string? TransactionId, 
    string? ValId, 
    double Amount, 
    string? BankTranId, 
    string? CardType, 
    string? Message
);

public interface ISslCommerzService
{
    Task<SslCommerzInitResult> InitiatePaymentAsync(long orderId, long userId, string? customCallbackBaseUrl = null);
    Task<SslCommerzValidationResult> ValidatePaymentAsync(string valId, string tranId, double? expectedAmount = null);
    Task<bool> ProcessPaymentSuccessAsync(string valId, string tranId, double amount, string? cardType, string? bankTranId);
    Task<bool> ProcessPaymentFailAsync(string tranId, string? errorReason);
    Task<bool> ProcessPaymentCancelAsync(string tranId);
}
