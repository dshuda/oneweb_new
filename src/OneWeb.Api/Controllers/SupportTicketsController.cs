using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api.Controllers;

/// <summary>
/// Customer support tickets. The entity shipped with the schema but had no
/// controller, so nothing could raise or answer a ticket. Ported from the
/// Laravel SupportTicketController.
/// </summary>
[ApiController]
[Route("api/v1/support-tickets")]
public class SupportTicketsController : ControllerBase
{
    private static readonly string[] Statuses = ["open", "replied", "closed"];

    private readonly AppDbContext _dbContext;

    public SupportTicketsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private long GetUserId() =>
        long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    // Customer: raise a ticket.
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreateTicketRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Subject) || string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new { message = "Subject and message are both required" });

        var ticket = new SupportTicket
        {
            UserId = GetUserId(),
            Subject = request.Subject.Trim(),
            Message = request.Message.Trim(),
            Status = "open",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _dbContext.SupportTickets.Add(ticket);
        await _dbContext.SaveChangesAsync();

        return Created($"/api/v1/support-tickets/{ticket.Id}", new { ticket.Id });
    }

    // Customer: their own tickets only.
    [HttpGet("mine")]
    [Authorize]
    public async Task<IActionResult> GetMine()
    {
        var userId = GetUserId();
        var tickets = await _dbContext.SupportTickets
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new { t.Id, t.Subject, t.Message, t.Status, t.CreatedAt, t.UpdatedAt })
            .ToListAsync();

        return Ok(tickets);
    }

    // Admin: every ticket, with who raised it.
    [HttpGet("/api/v1/admin/support-tickets")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var query = _dbContext.SupportTickets.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && status != "all")
            query = query.Where(t => t.Status == status);

        var tickets = await query
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                t.Id,
                t.Subject,
                t.Message,
                t.Status,
                t.CreatedAt,
                t.UpdatedAt,
                t.UserId,
                UserName = t.User != null ? t.User.Name : null,
                UserPhone = t.User != null ? t.User.Phone : null,
                UserEmail = t.User != null ? t.User.Email : null,
            })
            .ToListAsync();

        return Ok(tickets);
    }

    /// <summary>
    /// Answer a ticket. The reply is delivered as a notification so the customer
    /// sees it in-app, and the ticket moves to "replied" unless it is being closed.
    /// </summary>
    [HttpPut("/api/v1/admin/support-tickets/{id:long}")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> Respond(long id, [FromBody] RespondTicketRequest request)
    {
        var ticket = await _dbContext.SupportTickets.FirstOrDefaultAsync(t => t.Id == id);
        if (ticket == null)
            return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Status) && !Statuses.Contains(request.Status))
            return BadRequest(new { message = "Status must be open, replied or closed" });

        if (!string.IsNullOrWhiteSpace(request.Reply) && ticket.UserId is > 0)
        {
            _dbContext.Notifications.Add(new Notification
            {
                UserId = ticket.UserId.Value,
                Title = $"Re: {ticket.Subject}",
                Description = request.Reply.Trim(),
                Type = "support",
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            });
        }

        ticket.Status = string.IsNullOrWhiteSpace(request.Status)
            ? (string.IsNullOrWhiteSpace(request.Reply) ? ticket.Status : "replied")
            : request.Status;
        ticket.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return Ok(new { message = "Ticket updated" });
    }

    [HttpDelete("/api/v1/admin/support-tickets/{id:long}")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> Delete(long id)
    {
        var ticket = await _dbContext.SupportTickets.FirstOrDefaultAsync(t => t.Id == id);
        if (ticket == null)
            return NotFound();

        _dbContext.SupportTickets.Remove(ticket);
        await _dbContext.SaveChangesAsync();
        return Ok(new { message = "Ticket deleted" });
    }

    public record CreateTicketRequest(string Subject, string Message);
    public record RespondTicketRequest(string? Reply, string? Status);
}
