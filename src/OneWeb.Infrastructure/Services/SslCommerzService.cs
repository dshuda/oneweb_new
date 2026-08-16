using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OneWeb.Domain.Entities;
using OneWeb.Domain.Interfaces;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Infrastructure.Services;

public class SslCommerzService : ISslCommerzService
{
    private readonly HttpClient _httpClient;
    private readonly AppDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SslCommerzService> _logger;

    private readonly string _storeId;
    private readonly string _storePassword;
    private readonly string _apiBaseUrl;
    private readonly string _validationBaseUrl;
    private readonly string _currency;

    public SslCommerzService(
        HttpClient httpClient,
        AppDbContext dbContext,
        IConfiguration configuration,
        ILogger<SslCommerzService> logger)
    {
        _httpClient = httpClient;
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;

        _storeId = _configuration["SslCommerz:StoreId"] 
            ?? Environment.GetEnvironmentVariable("SSLCOMMERZ_STORE_ID") 
            ?? "labai69d4e6bc24ef7";

        _storePassword = _configuration["SslCommerz:StorePassword"] 
            ?? Environment.GetEnvironmentVariable("SSLCOMMERZ_STORE_PASSWORD") 
            ?? "labai69d4e6bc24ef7@ssl";

        _apiBaseUrl = _configuration["SslCommerz:ApiBaseUrl"] 
            ?? Environment.GetEnvironmentVariable("SSLCOMMERZ_API_BASE_URL") 
            ?? "https://sandbox.sslcommerz.com";

        _validationBaseUrl = _configuration["SslCommerz:ValidationBaseUrl"] 
            ?? Environment.GetEnvironmentVariable("SSLCOMMERZ_VALIDATION_BASE_URL") 
            ?? "https://sandbox.sslcommerz.com";

        _currency = _configuration["SslCommerz:Currency"] 
            ?? Environment.GetEnvironmentVariable("SSLCOMMERZ_CURRENCY") 
            ?? "BDT";
    }

    public async Task<SslCommerzInitResult> InitiatePaymentAsync(long orderId, long userId, string? customCallbackBaseUrl = null)
    {
        var order = await _dbContext.Orders
            .Include(o => o.User)
            .Include(o => o.Service)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

        if (order == null)
            return new SslCommerzInitResult(false, null, null, null, "Order not found");

        var amount = order.GrandTotal ?? 0;
        if (amount <= 0)
            return new SslCommerzInitResult(false, null, null, null, "Invalid order amount");

        var tranId = $"OT_{orderId}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
        
        // Base callback URL
        var callbackBase = !string.IsNullOrEmpty(customCallbackBaseUrl)
            ? customCallbackBaseUrl.TrimEnd('/')
            : (_configuration["FrontendUrl"]?.Replace("/web", "") ?? "http://104.248.232.169");

        var postData = new Dictionary<string, string>
        {
            { "store_id", _storeId },
            { "store_passwd", _storePassword },
            { "total_amount", amount.ToString("F2") },
            { "currency", _currency },
            { "tran_id", tranId },
            { "success_url", $"{callbackBase}/api/v1/sslcommerz/success" },
            { "fail_url", $"{callbackBase}/api/v1/sslcommerz/fail" },
            { "cancel_url", $"{callbackBase}/api/v1/sslcommerz/cancel" },
            { "ipn_url", $"{callbackBase}/api/v1/sslcommerz/ipn" },

            // Customer info
            { "cus_name", string.IsNullOrWhiteSpace(order.User?.Name) ? "OneTap Customer" : order.User.Name },
            { "cus_email", string.IsNullOrWhiteSpace(order.User?.Email) ? "customer@onetap.com.bd" : order.User.Email },
            { "cus_add1", string.IsNullOrWhiteSpace(order.ShippingAddress) ? "Dhaka" : order.ShippingAddress },
            { "cus_city", "Dhaka" },
            { "cus_postcode", "1200" },
            { "cus_country", "Bangladesh" },
            { "cus_phone", string.IsNullOrWhiteSpace(order.User?.Phone) ? "01700000000" : order.User.Phone },

            // Product & shipment info
            { "shipping_method", "NO" },
            { "product_name", string.IsNullOrWhiteSpace(order.Service?.Name) ? "OneTap Home Service" : order.Service.Name },
            { "product_category", "Service" },
            { "product_profile", "general" },
            
            // Custom values to correlate
            { "value_a", orderId.ToString() },
            { "value_b", userId.ToString() }
        };

        try
        {
            var initUrl = $"{_apiBaseUrl.TrimEnd('/')}/gwprocess/v4/api.php";
            var formContent = new FormUrlEncodedContent(postData);
            
            var response = await _httpClient.PostAsync(initUrl, formContent);
            var responseString = await response.Content.ReadAsStringAsync();

            _logger.LogInformation("SSLCommerz Init Response: {Response}", responseString);

            using var doc = JsonDocument.Parse(responseString);
            var root = doc.RootElement;

            var status = root.TryGetProperty("status", out var s) ? s.GetString() : null;
            if (string.Equals(status, "SUCCESS", StringComparison.OrdinalIgnoreCase))
            {
                var gatewayUrl = root.TryGetProperty("GatewayPageURL", out var g) ? g.GetString() : null;
                var sessionKey = root.TryGetProperty("sessionkey", out var sk) ? sk.GetString() : null;

                // Track initial pending payment
                var payment = await _dbContext.Payments.FirstOrDefaultAsync(p => p.OrderId == orderId);
                if (payment == null)
                {
                    payment = new Payment
                    {
                        OrderId = orderId,
                        UserId = userId,
                        Amount = amount,
                        PaymentMethod = "sslcommerz",
                        Status = "pending",
                        TransactionId = tranId,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _dbContext.Payments.Add(payment);
                }
                else
                {
                    payment.Amount = amount;
                    payment.PaymentMethod = "sslcommerz";
                    payment.Status = "pending";
                    payment.TransactionId = tranId;
                    payment.UpdatedAt = DateTime.UtcNow;
                }

                order.PaymentType = "sslcommerz";
                order.PaymentStatus = "unpaid";
                await _dbContext.SaveChangesAsync();

                return new SslCommerzInitResult(true, gatewayUrl, sessionKey, tranId, "Payment session initiated");
            }
            else
            {
                var failedReason = root.TryGetProperty("failedreason", out var fr) ? fr.GetString() : "SSLCommerz initiation failed";
                _logger.LogWarning("SSLCommerz initiation failed: {Reason}", failedReason);
                return new SslCommerzInitResult(false, null, null, tranId, failedReason);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initiating SSLCommerz payment for order {OrderId}", orderId);
            return new SslCommerzInitResult(false, null, null, tranId, ex.Message);
        }
    }

    public async Task<SslCommerzValidationResult> ValidatePaymentAsync(string valId, string tranId, double? expectedAmount = null)
    {
        if (string.IsNullOrEmpty(valId))
            return new SslCommerzValidationResult(false, "FAILED", tranId, valId, 0, null, null, "Validation ID is empty");

        try
        {
            var validatorUrl = $"{_validationBaseUrl.TrimEnd('/')}/validator/api/validationserverAPI.php?val_id={Uri.EscapeDataString(valId)}&store_id={Uri.EscapeDataString(_storeId)}&store_passwd={Uri.EscapeDataString(_storePassword)}&format=json";

            var response = await _httpClient.GetAsync(validatorUrl);
            var responseString = await response.Content.ReadAsStringAsync();

            _logger.LogInformation("SSLCommerz Validation Response: {Response}", responseString);

            using var doc = JsonDocument.Parse(responseString);
            var root = doc.RootElement;

            var status = root.TryGetProperty("status", out var s) ? s.GetString() : null;
            var isValid = string.Equals(status, "VALID", StringComparison.OrdinalIgnoreCase) ||
                          string.Equals(status, "VALIDATED", StringComparison.OrdinalIgnoreCase);

            double parsedAmount = 0;
            if (root.TryGetProperty("amount", out var amtProp))
            {
                if (amtProp.ValueKind == JsonValueKind.Number)
                    parsedAmount = amtProp.GetDouble();
                else if (amtProp.ValueKind == JsonValueKind.String && double.TryParse(amtProp.GetString(), out var a))
                    parsedAmount = a;
            }

            var bankTranId = root.TryGetProperty("bank_tran_id", out var bti) ? bti.GetString() : null;
            var cardType = root.TryGetProperty("card_type", out var ct) ? ct.GetString() : null;

            if (isValid && expectedAmount.HasValue && Math.Abs(parsedAmount - expectedAmount.Value) > 0.01)
            {
                _logger.LogWarning("SSLCommerz amount mismatch: expected {Expected}, got {Actual}", expectedAmount.Value, parsedAmount);
                return new SslCommerzValidationResult(false, "AMOUNT_MISMATCH", tranId, valId, parsedAmount, bankTranId, cardType, "Amount does not match order total");
            }

            return new SslCommerzValidationResult(isValid, status, tranId, valId, parsedAmount, bankTranId, cardType, isValid ? "Payment valid" : "Payment invalid");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating SSLCommerz payment for val_id {ValId}", valId);
            return new SslCommerzValidationResult(false, "ERROR", tranId, valId, 0, null, null, ex.Message);
        }
    }

    public async Task<bool> ProcessPaymentSuccessAsync(string valId, string tranId, double amount, string? cardType, string? bankTranId)
    {
        // Extract order ID from transaction ID (e.g. OT_123_...)
        long orderId = 0;
        var parts = tranId.Split('_');
        if (parts.Length >= 2 && long.TryParse(parts[1], out var parsedId))
        {
            orderId = parsedId;
        }

        var order = await _dbContext.Orders
            .FirstOrDefaultAsync(o => o.Id == orderId || (o.Payment != null && o.Payment.TransactionId == tranId));

        if (order == null)
        {
            _logger.LogWarning("Order not found for transaction {TranId}", tranId);
            return false;
        }

        order.PaymentStatus = "paid";
        order.DeliveryStatus = order.DeliveryStatus == "pending" ? "confirmed" : order.DeliveryStatus;
        order.PaymentType = "sslcommerz";
        order.PaymentDetails = JsonSerializer.Serialize(new
        {
            val_id = valId,
            bank_tran_id = bankTranId,
            card_type = cardType,
            paid_amount = amount,
            paid_at = DateTime.UtcNow
        });

        var payment = await _dbContext.Payments.FirstOrDefaultAsync(p => p.OrderId == order.Id);
        if (payment != null)
        {
            payment.Status = "completed";
            payment.Amount = amount;
            payment.TransactionId = bankTranId ?? tranId;
            payment.PaymentMethod = "sslcommerz";
            payment.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            payment = new Payment
            {
                OrderId = order.Id,
                UserId = order.UserId,
                Amount = amount,
                PaymentMethod = "sslcommerz",
                Status = "completed",
                TransactionId = bankTranId ?? tranId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _dbContext.Payments.Add(payment);
        }

        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Order {OrderId} marked as paid via SSLCommerz (TranId: {TranId})", order.Id, tranId);
        return true;
    }

    public async Task<bool> ProcessPaymentFailAsync(string tranId, string? errorReason)
    {
        long orderId = 0;
        var parts = tranId.Split('_');
        if (parts.Length >= 2 && long.TryParse(parts[1], out var parsedId))
        {
            orderId = parsedId;
        }

        var payment = await _dbContext.Payments.FirstOrDefaultAsync(p => p.TransactionId == tranId || p.OrderId == orderId);
        if (payment != null)
        {
            payment.Status = "failed";
            payment.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
        }

        _logger.LogWarning("Payment failed for tranId {TranId}: {Reason}", tranId, errorReason);
        return true;
    }

    public async Task<bool> ProcessPaymentCancelAsync(string tranId)
    {
        long orderId = 0;
        var parts = tranId.Split('_');
        if (parts.Length >= 2 && long.TryParse(parts[1], out var parsedId))
        {
            orderId = parsedId;
        }

        var payment = await _dbContext.Payments.FirstOrDefaultAsync(p => p.TransactionId == tranId || p.OrderId == orderId);
        if (payment != null)
        {
            payment.Status = "cancelled";
            payment.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
        }

        _logger.LogInformation("Payment cancelled for tranId {TranId}", tranId);
        return true;
    }
}
