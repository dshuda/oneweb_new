using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Domain.Interfaces;
using OneWeb.Infrastructure.Persistence;
using FirebaseAdmin;
using FirebaseAdmin.Messaging;

namespace OneWeb.Infrastructure.Services;

public class FcmService : IFcmService
{
    private readonly AppDbContext _dbContext;

    public FcmService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task SendToUserAsync(long userId, string title, string body, Dictionary<string, string>? data = null)
    {
        try
        {
            var tokens = await _dbContext.FcmTokens
                .Where(t => t.UserId == userId)
                .Select(t => t.Token)
                .ToListAsync();

            if (!tokens.Any())
                return;

            var message = new MulticastMessage
            {
                Notification = new FirebaseAdmin.Messaging.Notification
                {
                    Title = title,
                    Body = body
                },
                Data = data ?? new Dictionary<string, string>(),
                Tokens = tokens
            };

            var response = await FirebaseMessaging.DefaultInstance.SendEachForMulticastAsync(message);

            if (response.FailureCount > 0)
            {
                var invalidTokens = new List<string>();
                for (int i = 0; i < response.Responses.Count; i++)
                {
                    if (!response.Responses[i].IsSuccess)
                    {
                        invalidTokens.Add(tokens[i]);
                    }
                }

                if (invalidTokens.Any())
                {
                    var fcmTokens = await _dbContext.FcmTokens
                        .Where(t => invalidTokens.Contains(t.Token))
                        .ToListAsync();
                    
                    _dbContext.FcmTokens.RemoveRange(fcmTokens);
                    await _dbContext.SaveChangesAsync();
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"FCM Send Error: {ex.Message}");
        }
    }

    public async Task SendToTopicAsync(string topic, string title, string body)
    {
        try
        {
            var message = new Message
            {
                Notification = new FirebaseAdmin.Messaging.Notification
                {
                    Title = title,
                    Body = body
                },
                Topic = topic
            };

            await FirebaseMessaging.DefaultInstance.SendAsync(message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"FCM Topic Send Error: {ex.Message}");
        }
    }
}
