namespace OneWeb.Domain.Interfaces;

public interface IPaymentService
{
    Task<PaymentResult> ProcessCodPaymentAsync(long orderId, long userId);
    Task<PaymentResult> InitiateMobilePaymentAsync(long orderId, long userId, string provider, double amount);
    Task<bool> VerifyMobilePaymentAsync(long orderId, string transactionId, string provider);
}

public record PaymentResult(bool Success, string? TransactionId, string? PaymentUrl, string? Message);
