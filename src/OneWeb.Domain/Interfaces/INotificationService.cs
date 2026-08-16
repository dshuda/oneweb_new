namespace OneWeb.Domain.Interfaces;

public interface INotificationService
{
    Task NotifyOrderStatusChanged(long orderId, string newStatus, long userId);
    Task SaveNotification(long? userId, string title, string body, string type);
}
