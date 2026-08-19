using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api.Controllers.Admin;

/// <summary>
/// Sends an announcement to customers. Ported from the Laravel
/// PushNotificationController: notifications are persisted so they appear in the
/// in-app feed, and the stored FCM tokens are reported so it is clear how many
/// devices a real push would reach once a provider key is configured.
/// </summary>
[ApiController]
[Route("api/v1/admin/broadcast")]
[Authorize(Roles = "admin,staff")]
public class BroadcastController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public BroadcastController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>Audience sizes, so the composer can show reach before sending.</summary>
    [HttpGet("audience")]
    public async Task<IActionResult> GetAudience()
    {
        var customers = await _dbContext.Users.CountAsync(u => u.UserType == "customer" && u.Status);
        var vendors = await _dbContext.Users.CountAsync(u => u.UserType == "vendor" && u.Status);
        var devices = await _dbContext.FcmTokens.CountAsync();

        return Ok(new { customers, vendors, all = customers + vendors, devices });
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        // Group the fan-out back into the announcements that produced it.
        var sent = await _dbContext.Notifications
            .Where(n => n.Type == "announcement")
            .GroupBy(n => new { n.Title, n.Description, n.CreatedAt })
            .Select(g => new
            {
                g.Key.Title,
                g.Key.Description,
                g.Key.CreatedAt,
                Recipients = g.Count(),
                Read = g.Count(n => n.IsRead),
            })
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
            .ToListAsync();

        return Ok(sent);
    }

    [HttpPost]
    public async Task<IActionResult> Send([FromBody] BroadcastRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new { message = "Title and message are both required" });

        var audience = (request.Audience ?? "customers").ToLowerInvariant();
        var query = _dbContext.Users.Where(u => u.Status);

        query = audience switch
        {
            "customers" => query.Where(u => u.UserType == "customer"),
            "vendors" => query.Where(u => u.UserType == "vendor"),
            "all" => query.Where(u => u.UserType == "customer" || u.UserType == "vendor"),
            _ => query.Where(u => u.UserType == "customer"),
        };

        var userIds = await query.Select(u => u.Id).ToListAsync();
        if (userIds.Count == 0)
            return BadRequest(new { message = "That audience has no active users" });

        // One timestamp for the whole batch so history can group them.
        var sentAt = DateTime.UtcNow;
        var notifications = userIds.Select(id => new Notification
        {
            UserId = id,
            Title = request.Title.Trim(),
            Description = request.Message.Trim(),
            Type = "announcement",
            IsRead = false,
            CreatedAt = sentAt,
            UpdatedAt = sentAt,
        });

        _dbContext.Notifications.AddRange(notifications);
        await _dbContext.SaveChangesAsync();

        var devices = await _dbContext.FcmTokens.CountAsync(t => userIds.Contains(t.UserId));

        return Ok(new
        {
            message = $"Delivered to {userIds.Count} user(s).",
            recipients = userIds.Count,
            devicesRegistered = devices,
        });
    }

    public record BroadcastRequest(string Title, string Message, string? Audience);
}
