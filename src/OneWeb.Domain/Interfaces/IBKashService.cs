


    namespace OneWeb.Api;

    public interface IBKashService
    {
        Task<GrantTokenResponse> GrantTokenAsync();
        Task<RefreshTokenResponse> RefreshTokenAsync(string refreshToken);
        Task<CreateAgreementResponse> CreateAgreementAsync(CreateAgreementRequest request);
        Task<ExecuteAgreementResponse> ExecuteAgreementAsync(string agreementId);
        Task<CreatePaymentResponse> CreatePaymentAsync(CreatePaymentRequest request);
        Task<CreatePaymentWithAgreementResponse> CreatePaymentWithAgreementAsync(CreatePaymentWithAgreementRequest request);
        Task<ExecutePaymentResponse> ExecutePaymentAsync(string paymentId);
        Task<ExecutePaymentResponse> ExecutePaymentWithAgreementAsync(string paymentId);
        Task<QueryPaymentResponse> QueryPaymentAsync(string paymentId);
        Task<QueryAgreementResponse> QueryAgreementAsync(string agreementId);
        Task<RefundResponse> RefundAsync(RefundRequest request);
        Task<RefundStatusResponse> RefundStatusAsync(RefundStatusRequest request);
    }

    public class BKashConfig
    {
        public string BaseUrl { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string AppKey { get; set; } = string.Empty;
        public string AppSecret { get; set; } = string.Empty;
        public int TokenExpirySeconds { get; set; } = 3600;
    }

    public class TokenCache
    {
        public string IdToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public bool IsValid => DateTime.UtcNow < ExpiresAt;
    }


// DTOs
public class ErrorResponse
{
    public string externalCode { get; set; }
    public string errorMessageEn { get; set; }
}

public class GrantTokenResponse
{
    public string id_token { get; set; }
    public string token_type { get; set; }
    public int? expires_in { get; set; }
    public string refresh_token { get; set; }
}

public class RefreshTokenResponse
{
    public string id_token { get; set; }
    public string token_type { get; set; }
    public int? expires_in { get; set; }
    public string refresh_token { get; set; }
}

public class CreateAgreementRequest
{
    public string PayerReference { get; set; }
    public string CallbackURL { get; set; }
}

public class CreateAgreementResponse
{
    public string paymentId { get; set; }
    public string agreementId { get; set; }
    public string agreementCreateTime { get; set; }
    public string agreementStatus { get; set; }
    public string bkashURL { get; set; }
    public string callbackURL { get; set; }
    public string successCallbackURL { get; set; }
    public string failureCallbackURL { get; set; }
    public string cancelledCallbackURL { get; set; }
    public string signature { get; set; }
}

public class ExecuteAgreementResponse
{
    public string paymentId { get; set; }
    public string agreementId { get; set; }
    public string agreementStatus { get; set; }
    public string agreementExecuteTime { get; set; }
    public string payerReference { get; set; }
    public string payerAccount { get; set; }
    public string payerType { get; set; }
}

public class CreatePaymentRequest
{
    public string PayerReference { get; set; }
    public string CallbackURL { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "BDT";
    public string Intent { get; set; } = "sale";
    public string MerchantInvoiceNumber { get; set; }
}

public class CreatePaymentResponse
{
    public string paymentId { get; set; }
    public string paymentCreateTime { get; set; }
    public string transactionStatus { get; set; }
    public string amount { get; set; }
    public string currency { get; set; }
    public string intent { get; set; }
    public string merchantInvoiceNumber { get; set; }
    public string bkashURL { get; set; }
    public string callbackURL { get; set; }
    public string successCallbackURL { get; set; }
    public string failureCallbackURL { get; set; }
    public string cancelledCallbackURL { get; set; }
    public string signature { get; set; }
}

public class CreatePaymentWithAgreementRequest
{
    public string AgreementId { get; set; }
    public string PayerReference { get; set; }
    public string CallbackURL { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "BDT";
    public string Intent { get; set; } = "sale";
    public string MerchantInvoiceNumber { get; set; }
}

public class CreatePaymentWithAgreementResponse
{
    public string paymentId { get; set; }
    public string agreementId { get; set; }
    public string paymentCreateTime { get; set; }
    public string transactionStatus { get; set; }
    public string amount { get; set; }
    public string currency { get; set; }
    public string intent { get; set; }
    public string merchantInvoiceNumber { get; set; }
    public string bkashURL { get; set; }
    public string callbackURL { get; set; }
    public string successCallbackURL { get; set; }
    public string failureCallbackURL { get; set; }
    public string cancelledCallbackURL { get; set; }
    public string signature { get; set; }
}

public class ExecutePaymentResponse
{
    public string paymentId { get; set; }
    public string trxId { get; set; }
    public string transactionStatus { get; set; }
    public string amount { get; set; }
    public string currency { get; set; }
    public string intent { get; set; }
    public string paymentExecuteTime { get; set; }
    public string merchantInvoiceNumber { get; set; }
    public string subMerchantName { get; set; }
    public string payerType { get; set; }
    public string payerReference { get; set; }
    public string payerAccount { get; set; }
    public string agreementId { get; set; }
    public string maxRefundableAmount { get; set; }
}

public class QueryPaymentResponse
{
    public string paymentId { get; set; }
    public string verificationStatus { get; set; }
    public string payerReference { get; set; }
    public string trxId { get; set; }
    public string paymentCreateTime { get; set; }
    public string paymentExecuteTime { get; set; }
    public string amount { get; set; }
    public string currency { get; set; }
    public string intent { get; set; }
    public string merchantInvoice { get; set; }
    public string transactionStatus { get; set; }
    public string serviceFee { get; set; }
    public string subMerchantName { get; set; }
    public string payerType { get; set; }
    public string maxRefundableAmount { get; set; }
}

public class QueryAgreementResponse
{
    public string paymentId { get; set; }
    public string verificationStatus { get; set; }
    public string payerReference { get; set; }
    public string agreementId { get; set; }
    public string agreementStatus { get; set; }
    public string agreementCreateTime { get; set; }
    public string agreementExecuteTime { get; set; }
    public string payerAccount { get; set; }
    public string payerType { get; set; }
}

public class RefundRequest
{
    public string PaymentId { get; set; }
    public string RefundAmount { get; set; }
    public string TransactionId { get; set; }
    public string Reason { get; set; }
    public string Sku { get; set; }
}

public class RefundResponse
{
    public string originalTrxId { get; set; }
    public string refundTrxId { get; set; }
    public string refundTransactionStatus { get; set; }
    public string originalTrxAmount { get; set; }
    public string refundAmount { get; set; }
    public string currency { get; set; }
    public string completedTime { get; set; }
    public string sku { get; set; }
    public string reason { get; set; }
}

public class RefundStatusRequest
{
    public string PaymentId { get; set; }
    public string TransactionId { get; set; }
}

public class RefundStatusResponse
{
    public string originalTrxId { get; set; }
    public string originalTrxAmount { get; set; }
    public string originalTrxCompletedTime { get; set; }
    public List<RefundTransaction> refundTransactions { get; set; }
}

public class RefundTransaction
{
    public string refundTrxId { get; set; }
    public string refundTransactionStatus { get; set; }
    public string refundAmount { get; set; }
    public string completedTime { get; set; }
}
