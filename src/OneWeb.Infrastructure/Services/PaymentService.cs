using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Domain.Interfaces;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Infrastructure.Services;

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _dbContext;

    public PaymentService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PaymentResult> ProcessCodPaymentAsync(long orderId, long userId)
    {
        var order = await _dbContext.Orders
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

        if (order == null)
            return new PaymentResult(false, null, null, "Order not found");

        var payment = new Payment
        {
            OrderId = orderId,
            UserId = userId,
            PaymentMethod = "cod",
            Status = "pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Payments.Add(payment);
        order.PaymentStatus = "unpaid"; // COD confirmed after delivery
        await _dbContext.SaveChangesAsync();

        return new PaymentResult(true, $"COD-{orderId}", null, "COD confirmed");
    }

    public async Task<PaymentResult> InitiateMobilePaymentAsync(long orderId, long userId, string provider, double amount)
    {
        var supportedProviders = new[] { "bkash", "nagad", "rocket" };
        if (!supportedProviders.Contains(provider.ToLower()))
            return new PaymentResult(false, null, null, "Unsupported payment provider");

        var order = await _dbContext.Orders
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

        if (order == null)
            return new PaymentResult(false, null, null, "Order not found");

        var transactionId = Guid.NewGuid().ToString();

        var payment = new Payment
        {
            OrderId = orderId,
            UserId = userId,
            Amount = amount,
            PaymentMethod = provider,
            TransactionId = transactionId,
            Status = "pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Payments.Add(payment);
        await _dbContext.SaveChangesAsync();

        // TODO: Integrate actual bKash/Nagad API
        var paymentUrl = $"https://payment.oneweb.com/pay/{orderId}";

        return new PaymentResult(true, transactionId, paymentUrl, "Redirect to payment");
    }

    public async Task<bool> VerifyMobilePaymentAsync(long orderId, string transactionId, string provider)
    {
        var payment = await _dbContext.Payments
            .FirstOrDefaultAsync(p => p.OrderId == orderId && p.TransactionId == transactionId);

        if (payment == null)
            return false;

        payment.Status = "completed";
        payment.UpdatedAt = DateTime.UtcNow;

        var order = await _dbContext.Orders.FindAsync(orderId);
        if (order != null)
        {
            order.PaymentStatus = "paid";
            order.UpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync();
        return true;
    }
}
