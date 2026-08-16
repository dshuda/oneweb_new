using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Application.Features.Orders.DTOs;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Orders.Commands;

public class CancelOrderCommandHandler : IRequestHandler<CancelOrderCommand, bool>
{
    private readonly AppDbContext _dbContext;
    
    public CancelOrderCommandHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    public async Task<bool> Handle(CancelOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _dbContext.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);
        
        if (order == null)
            return false;
        
        // Check permissions based on role
        if (request.UserRole == "customer")
        {
            // Customer can only cancel if status is "pending"
            if (order.DeliveryStatus != "pending")
                return false;
            
            // Verify the order belongs to the user
            if (order.UserId != request.UserId)
                return false;
        }
        else if (request.UserRole == "admin" || request.UserRole == "staff")
        {
            // Admin/staff can cancel any non-completed order
            if (order.DeliveryStatus == "completed")
                return false;
        }
        else
        {
            return false;
        }
        
        // Cancel the order
        order.IsCancelled = 1;
        order.DeliveryStatus = "cancelled";
        order.UpdatedAt = DateTime.UtcNow;
        
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
