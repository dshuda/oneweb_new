namespace OneWeb.Domain.Interfaces;

public interface IFcmService
{
    Task SendToUserAsync(long userId, string title, string body, Dictionary<string, string>? data = null);
    Task SendToTopicAsync(string topic, string title, string body);
}
