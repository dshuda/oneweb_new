using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Application.Features.Orders.DTOs;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Orders.Queries;

public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, OrderDetailResponse?>
{
    private readonly AppDbContext _dbContext;
    
    public GetOrderByIdQueryHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    public async Task<OrderDetailResponse?> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        // Fetch order with Service
        var order = await _dbContext.Orders
            .Include(o => o.Service)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);
        
        if (order == null)
            return null;
        
        // Verify access based on role
        if (request.UserRole == "customer")
        {
            if (order.UserId != request.UserId)
                return null;
        }
        else if (request.UserRole == "vendor")
        {
            if (order.VendorId != request.UserId)
                return null;
        }
        // Admin and staff can see all orders
        
        // Parse DeliverStatusJson to StatusHistory
        var statusHistory = string.IsNullOrEmpty(order.DeliverStatusJson) 
            ? new List<StatusHistoryItem>()
            : JsonSerializer.Deserialize<List<StatusHistoryItem>>(order.DeliverStatusJson) ?? new List<StatusHistoryItem>();
        
        // Create OrderDto
        var orderDto = new OrderDto(
            order.Id,
            order.TrackingCode,
            order.DeliveryStatus,
            order.PaymentStatus,
            order.PaymentType,
            order.GrandTotal,
            order.CouponDiscount,
            order.ShippingAddress,
            order.AdditionalInfo,
            order.CreatedAt,
            string.Empty,
            order.Service != null 
                ? new ServiceSummaryDto(order.Service.Id, order.Service.Name, order.Service.Slug) 
                : null,
            order.OrderFrom
        );
        
        return new OrderDetailResponse(orderDto, statusHistory);
    }
}
