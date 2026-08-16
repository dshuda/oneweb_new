using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Interfaces;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Orders.Commands;

public class UpdateOrderStatusCommandHandler : IRequestHandler<UpdateOrderStatusCommand, bool>
{
    private readonly AppDbContext _dbContext;
    private readonly IDashboardCacheService _cacheService;
    
    public UpdateOrderStatusCommandHandler(AppDbContext dbContext, IDashboardCacheService cacheService)
    {
        _dbContext = dbContext;
        _cacheService = cacheService;
    }
    
    public async Task<bool> Handle(UpdateOrderStatusCommand request, CancellationToken cancellationToken)
    {
        var order = await _dbContext.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);
        
        if (order == null)
            return false;
        
        // Validate transition based on role
        if (!IsValidTransition(order.DeliveryStatus, request.NewStatus, request.UpdatedByRole))
            return false;
        
        // Update DeliveryStatus
        order.DeliveryStatus = request.NewStatus;
        
        // Append to DeliverStatusJson
        var history = string.IsNullOrEmpty(order.DeliverStatusJson) 
            ? new List<object>()
            : JsonSerializer.Deserialize<List<object>>(order.DeliverStatusJson) ?? new List<object>();
        
        history.Add(new { status = request.NewStatus, timestamp = DateTime.UtcNow.ToString("o") });
        order.DeliverStatusJson = JsonSerializer.Serialize(history);
        order.UpdatedAt = DateTime.UtcNow;
        
        // If completed: calculate commission and update vendor balance
        if (request.NewStatus == "completed" && order.VendorId.HasValue)
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
        
        // T4.1 — Invalidate dashboard cache
        await _cacheService.InvalidateStatsAsync();
        
        return true;
    }
    
    private bool IsValidTransition(string currentStatus, string newStatus, string role)
    {
        return (currentStatus, newStatus, role) switch
        {
            ("pending", "confirmed", "admin" or "staff") => true,
            ("confirmed", "assigned", "admin" or "staff") => true,
            ("assigned", "on_the_way", "vendor") => true,
            ("on_the_way", "in_progress", "vendor") => true,
            ("in_progress", "completed", "vendor") => true,
            (_, "cancelled", "customer") => currentStatus == "pending",
            (_, "cancelled", "admin" or "staff") => currentStatus != "completed",
            _ => false
        };
    }
}
