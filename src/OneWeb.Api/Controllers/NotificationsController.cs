using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api.Controllers;

[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public NotificationsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private long GetUserId() =>
        long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

    [HttpGet()]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        var userId = GetUserId();

        var query = _dbContext.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var notifications = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationDto(
                n.Id,
                n.Title,
                n.Description,
                n.Type,
                n.IsRead,
                n.CreatedAt
            ))
            .ToListAsync();

        return Ok(new
        {
            items = notifications,
            totalCount,
            page,
            pageSize,
            totalPages
        });
    }

    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkAsRead(long id)
    {
        var userId = GetUserId();

        var notification = await _dbContext.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification == null)
            return NotFound();

        notification.IsRead = true;
        notification.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return Ok(new { message = "Notification marked as read" });
    }

    [HttpPost("fcm-token")]
    public async Task<IActionResult> SaveFcmToken([FromBody] SaveFcmTokenRequest request)
    {
        var userId = GetUserId();

        var existingToken = await _dbContext.FcmTokens
            .FirstOrDefaultAsync(t => t.Token == request.Token);

        if (existingToken != null)
        {
            existingToken.DeviceType = request.DeviceType;
            existingToken.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _dbContext.FcmTokens.Add(new FcmToken
            {
                UserId = userId,
                Token = request.Token,
                DeviceType = request.DeviceType,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        await _dbContext.SaveChangesAsync();
        return Ok(new { message = "FCM token saved" });
    }

    public record SaveFcmTokenRequest(string Token, string? DeviceType);
    public record NotificationDto(long Id, string? Title, string? Description, string? Type, bool IsRead, DateTime? CreatedAt);
}
