using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Api.DTOs;
using OneWeb.Domain.Entities;
using OneWeb.Domain.Interfaces;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/broadcast")]
[Authorize(Roles = "admin,staff")]
public class BroadcastAdminController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly INotificationService _notificationService;

    public BroadcastAdminController(AppDbContext dbContext, INotificationService notificationService)
    {
        _dbContext = dbContext;
        _notificationService = notificationService;
    }

    [HttpGet("audience")]
    public async Task<IActionResult> GetAudience()
    {
        var customers = await _dbContext.Users.CountAsync(u => u.UserType == "customer");
        var vendors = await _dbContext.Vendors.CountAsync();
        var allUsers = await _dbContext.Users.CountAsync();
        var total = customers + vendors;

        return ApiResponseFactory.Ok(new
        {
            customers,
            vendors,
            devices = allUsers,
            all = total
        }, HttpContext);
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        var broadcastList = await _dbContext.Notifications
            .Where(n => n.Type == "broadcast" || n.Type == "announcement")
            .GroupBy(n => new { n.Title, n.Description, n.CreatedAt })
            .OrderByDescending(g => g.Key.CreatedAt)
            .Select(g => new
            {
                title = g.Key.Title,
                description = g.Key.Description,
                recipients = g.Count(),
                read = g.Count(x => x.IsRead),
                createdAt = g.Key.CreatedAt
            })
            .Take(50)
            .ToListAsync();

        return ApiResponseFactory.Ok(broadcastList, HttpContext);
    }

    [HttpPost]
    public async Task<IActionResult> SendBroadcast([FromBody] SendBroadcastRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { message = "Title and message are required." });
        }

        var targetUsersQuery = _dbContext.Users.AsQueryable();

        if (request.Audience?.ToLower() == "customers")
        {
            targetUsersQuery = targetUsersQuery.Where(u => u.UserType == "customer");
        }
        else if (request.Audience?.ToLower() == "vendors")
        {
            var vendorUserIds = await _dbContext.Vendors
                .Select(v => v.UserId)
                .ToListAsync();

            targetUsersQuery = targetUsersQuery.Where(u => vendorUserIds.Contains(u.Id) || u.UserType == "vendor");
        }

        var targetUserIds = await targetUsersQuery.Select(u => u.Id).ToListAsync();

        var now = DateTime.UtcNow;
        var notifications = targetUserIds.Select(userId => new Notification
        {
            UserId = userId,
            Title = request.Title,
            Description = request.Message,
            Type = "broadcast",
            IsRead = false,
            CreatedAt = now
        }).ToList();

        if (notifications.Count > 0)
        {
            await _dbContext.Notifications.AddRangeAsync(notifications);
            await _dbContext.SaveChangesAsync();
        }
        else
        {
            // If no individual users found, save a global broadcast record
            var single = new Notification
            {
                UserId = null,
                Title = request.Title,
                Description = request.Message,
                Type = "broadcast",
                IsRead = false,
                CreatedAt = now
            };
            await _dbContext.Notifications.AddAsync(single);
            await _dbContext.SaveChangesAsync();
        }

        return ApiResponseFactory.Ok(new
        {
            message = $"Announcement broadcast to {Math.Max(notifications.Count, 1)} recipient(s) successfully."
        }, HttpContext);
    }
}

public class SendBroadcastRequest
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Audience { get; set; } = "customers";
}
