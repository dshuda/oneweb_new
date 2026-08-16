using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Domain.Interfaces;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _dbContext;
    private readonly IFcmService _fcmService;
    private readonly IHubContext<Hubs.OrderHub> _hubContext;

    public NotificationService(
        AppDbContext dbContext,
        IFcmService fcmService,
        IHubContext<Hubs.OrderHub> hubContext)
    {
        _dbContext = dbContext;
        _fcmService = fcmService;
        _hubContext = hubContext;
    }

    public async Task NotifyOrderStatusChanged(long orderId, string newStatus, long userId)
    {
        var title = "Order Status Updated";
        var body = $"Your order status has been changed to {newStatus}";

        // Save to notifications table
        await SaveNotification(userId, title, body, "order_status");

        // Send FCM push notification
        var data = new Dictionary<string, string>
        {
            { "orderId", orderId.ToString() },
            { "status", newStatus }
        };
        await _fcmService.SendToUserAsync(userId, title, body, data);

        // Broadcast via SignalR
        await _hubContext.Clients.Group($"order_{orderId}")
            .SendAsync("OrderStatusUpdated", new { orderId, status = newStatus });
    }

    public async Task SaveNotification(long? userId, string title, string body, string type)
    {
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Description = body,
            Type = type,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Notifications.Add(notification);
        await _dbContext.SaveChangesAsync();
    }
}
