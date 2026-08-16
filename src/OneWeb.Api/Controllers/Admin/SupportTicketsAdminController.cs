using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Api.DTOs;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/support-tickets")]
[Route("api/v1/admin/support_tickets")]
[Route("api/v1/admin/tickets")]
[Route("api/v1/admin/support")]
[Route("api/v1/admin/supporttickets")]
[Authorize]
public class SupportTicketsAdminController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public SupportTicketsAdminController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100)
    {
        var query = _dbContext.SupportTickets
            .Include(t => t.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && status.ToLower() != "all")
        {
            var st = status.Trim().ToLower();
            query = query.Where(t => t.Status != null && t.Status.ToLower() == st);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(t => 
                (t.Subject != null && t.Subject.ToLower().Contains(s)) ||
                (t.Message != null && t.Message.ToLower().Contains(s)) ||
                (t.User != null && t.User.Name != null && t.User.Name.ToLower().Contains(s)) ||
                (t.User != null && t.User.Phone != null && t.User.Phone.ToLower().Contains(s)));
        }

        var tickets = await query
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                id = t.Id,
                subject = t.Subject ?? "No Subject",
                message = t.Message ?? string.Empty,
                status = (t.Status ?? "open").ToLower(),
                userId = t.UserId,
                userName = t.User != null ? t.User.Name : "Customer",
                userPhone = t.User != null ? t.User.Phone : null,
                userEmail = t.User != null ? t.User.Email : null,
                user = t.User != null ? new
                {
                    id = t.User.Id,
                    name = t.User.Name,
                    phone = t.User.Phone,
                    email = t.User.Email
                } : null,
                createdAt = t.CreatedAt,
                updatedAt = t.UpdatedAt
            })
            .ToListAsync();

        return ApiResponseFactory.Ok(tickets, HttpContext);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(long id)
    {
        var ticket = await _dbContext.SupportTickets
            .Include(t => t.User)
            .Where(t => t.Id == id)
            .Select(t => new
            {
                id = t.Id,
                subject = t.Subject ?? "No Subject",
                message = t.Message ?? string.Empty,
                status = (t.Status ?? "open").ToLower(),
                userId = t.UserId,
                userName = t.User != null ? t.User.Name : "Customer",
                userPhone = t.User != null ? t.User.Phone : null,
                userEmail = t.User != null ? t.User.Email : null,
                user = t.User != null ? new
                {
                    id = t.User.Id,
                    name = t.User.Name,
                    phone = t.User.Phone,
                    email = t.User.Email
                } : null,
                createdAt = t.CreatedAt,
                updatedAt = t.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (ticket == null)
            return NotFound(new { message = "Ticket not found." });

        return ApiResponseFactory.Ok(ticket, HttpContext);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTicket(long id, [FromBody] UpdateTicketRequest request)
    {
        var ticket = await _dbContext.SupportTickets.FindAsync(id);
        if (ticket == null)
            return NotFound(new { message = "Ticket not found." });

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            ticket.Status = request.Status.Trim().ToLower();
        }

        ticket.UpdatedAt = DateTime.UtcNow;

        if (ticket.UserId.HasValue && !string.IsNullOrWhiteSpace(request.Reply))
        {
            await _dbContext.Notifications.AddAsync(new Notification
            {
                UserId = ticket.UserId.Value,
                Title = $"Support Reply: {ticket.Subject}",
                Description = request.Reply.Trim(),
                Type = "support",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _dbContext.SaveChangesAsync();

        return ApiResponseFactory.Ok(new
        {
            message = "Support ticket updated successfully."
        }, HttpContext);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTicket(long id)
    {
        var ticket = await _dbContext.SupportTickets.FindAsync(id);
        if (ticket == null)
            return NotFound(new { message = "Ticket not found." });

        _dbContext.SupportTickets.Remove(ticket);
        await _dbContext.SaveChangesAsync();

        return ApiResponseFactory.Ok(new
        {
            message = "Support ticket deleted successfully."
        }, HttpContext);
    }
}

public class UpdateTicketRequest
{
    public string? Reply { get; set; }
    public string Status { get; set; } = "replied";
}
