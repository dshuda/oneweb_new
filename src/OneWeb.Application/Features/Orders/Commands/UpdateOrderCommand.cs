using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Interfaces;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;
using OneWeb.Infrastructure.Bulk;
using System.ComponentModel.DataAnnotations;

namespace OneWeb.Application.Features.Orders.Commands;

public class UpdateOrderCommand :IValidatableObject, IRequest<bool>
{
    public long Id { get; set; }
    public long PriceId { get; set; }
    public string DeliveryStatus { get; set; }
    public string PaymentStatus { get; set; }
    public string PaymentType { get; set; }
    public double GrandTotal { get; set; }
    public long VendorId { get; set; }
    public string? UpdatedByRole { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var result = new List<ValidationResult>();
        if(DeliveryStatus == "assigned" && VendorId <= 0)
        {
            result.Add(new ValidationResult("Vendor Selection is Required when the status is assigned"));
        }

        return result;
    }
}


public class UpdateOrderCommandHandler : IRequestHandler<UpdateOrderCommand, bool>
{
    private readonly AppDbContext _dbContext;
    private readonly IDashboardCacheService _cacheService;
    private readonly IBulkSMServices _sms;
    
    public UpdateOrderCommandHandler(AppDbContext dbContext, IDashboardCacheService cacheService, IBulkSMServices sms)
    {
        _dbContext = dbContext;
        _cacheService = cacheService;
        _sms = sms;
    }
    
    public async Task<bool> Handle(UpdateOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _dbContext.Orders
            .Include(f => f.User)
            .FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken);
        
        if (order == null)
            return false;
        
        // Validate transition based on role
        if (!IsValidTransition(order.DeliveryStatus, request.DeliveryStatus, request.UpdatedByRole))
            return false;

        // Update Order Details
        if (request.PriceId > 0)
        {
            order.PriceId = request.PriceId;
        }

        if (!string.IsNullOrWhiteSpace(request.PaymentStatus))
        {
            order.PaymentStatus = request.PaymentStatus;
        }

        if (!string.IsNullOrWhiteSpace(request.PaymentType))
        {
            order.PaymentType = request.PaymentType;
        }

        if (request.GrandTotal > 0)
        {
            order.GrandTotal = request.GrandTotal;
        }

        // Set VendorId safely (null if <= 0)
        order.VendorId = request.VendorId > 0 ? request.VendorId : null;

        if (!string.IsNullOrWhiteSpace(request.DeliveryStatus))
        {
            order.DeliveryStatus = request.DeliveryStatus;
        }
        
        // Append to DeliverStatusJson
        var history = string.IsNullOrEmpty(order.DeliverStatusJson) 
            ? new List<object>()
            : JsonSerializer.Deserialize<List<object>>(order.DeliverStatusJson) ?? new List<object>();
        
        history.Add(new { status = order.DeliveryStatus, timestamp = DateTime.UtcNow.ToString("o") });
        order.DeliverStatusJson = JsonSerializer.Serialize(history);
        order.UpdatedAt = DateTime.UtcNow;

        // If completed: calculate commission and update vendor balance
        if (order.DeliveryStatus == "completed" && order.VendorId.HasValue)
        {
            var service = await _dbContext.Services.FirstOrDefaultAsync(s => s.Id == order.ServiceId, cancellationToken);
            var vendor = await _dbContext.Vendors.FirstOrDefaultAsync(v => v.Id == order.VendorId, cancellationToken);
            
            if (service != null && vendor != null)
            {
                var vendorCommissionRate = vendor.CommissionRate > 0 ? vendor.CommissionRate : service.CommissionRate;
                var vendorAmount = order.GrandTotal.HasValue 
                    ? order.GrandTotal.Value * (vendorCommissionRate / 100.0)
                    : 0;
                var adminAmount = order.GrandTotal.HasValue 
                    ? order.GrandTotal.Value - vendorAmount
                    : 0;
                
                // Create CommissionHistory record
                var commission = new CommissionHistory
                {
                    VendorId = vendor.Id,
                    OrderId = order.Id,
                    CommissionAmount = order.GrandTotal.HasValue ? order.GrandTotal.Value - vendorAmount : 0,
                    VendorAmount = vendorAmount,
                    AdminAmount = adminAmount,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _dbContext.CommissionHistories.Add(commission);
                
                // Update vendor balance
                vendor.PendingBalance += vendorAmount;
            }
        }
        
        await _dbContext.SaveChangesAsync(cancellationToken);

        // SMS notification to customer when vendor is assigned
        if (order.DeliveryStatus == "assigned" && order.VendorId.HasValue)
        {
            try
            {
                var n = order.User?.Name?.Split(" ")[0] ?? string.Empty;
                var vendor = await _dbContext.Vendors
                    .Where(f => f.Id == order.VendorId.Value)
                    .Include(f => f.User)
                    .FirstOrDefaultAsync(cancellationToken);
                var customer = await _dbContext.Users
                    .Where(f => f.Id == order.UserId)
                    .FirstOrDefaultAsync(cancellationToken);

                if (vendor?.User != null && customer != null && !string.IsNullOrWhiteSpace(customer.Phone))
                {
                    var message = $"Dear {n} Your Order {order.TrackingCode} has been confirmed. please call {vendor.User.Phone} for services";
                    await _sms.SendAsync("88" + customer.Phone, message);
                }
            }
            catch
            {
                // SMS failure should not break order update
            }
        }

        // Invalidate dashboard cache
        await _cacheService.InvalidateStatsAsync();
        
        return true;
    }
    
    private bool IsValidTransition(string currentStatus, string newStatus, string? role)
    {
        var userRole = (role ?? "admin").ToLower();
        
        // Admin and staff have full privilege to manage and assign orders
        if (userRole is "admin" or "staff")
        {
            return true;
        }

        if (currentStatus == newStatus)
        {
            return true;
        }

        return (currentStatus, newStatus, userRole) switch
        {
            ("assigned", "on_the_way", "vendor") => true,
            ("on_the_way", "in_progress", "vendor") => true,
            ("in_progress", "completed", "vendor") => true,
            (_, "cancelled", "customer") => currentStatus == "pending",
            _ => false
        };
    }
}
