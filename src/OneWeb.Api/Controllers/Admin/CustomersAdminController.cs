using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api.Controllers.Admin;

/// <summary>
/// Customers with their booking history. The users list shows every account
/// type with no context; this answers the questions actually asked about a
/// customer — how much have they spent, when did they last book.
/// </summary>
[ApiController]
[Route("api/v1/admin/customers")]
[Authorize(Roles = "admin,staff")]
public class CustomersAdminController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public CustomersAdminController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetCustomers()
    {
        // Aggregate in one grouped query rather than per-customer round trips.
        var stats = await _dbContext.Orders
            .GroupBy(o => o.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                Orders = g.Count(),
                Spent = g.Where(o => o.PaymentStatus == "paid").Sum(o => o.GrandTotal ?? 0),
                LastOrderAt = g.Max(o => o.CreatedAt),
            })
            .ToListAsync();

        var byUser = stats.ToDictionary(s => s.UserId, s => s);

        var customers = await _dbContext.Users
            .Where(u => u.UserType == "customer")
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id, u.Name, u.Phone, u.Email, u.Address,
                u.Status, u.CreatedAt, u.ImageId,
            })
            .ToListAsync();

        var result = customers.Select(c =>
        {
            byUser.TryGetValue(c.Id, out var s);
            return new
            {
                c.Id,
                c.Name,
                c.Phone,
                c.Email,
                c.Address,
                c.Status,
                c.CreatedAt,
                c.ImageId,
                Orders = s?.Orders ?? 0,
                Spent = s?.Spent ?? 0,
                LastOrderAt = s?.LastOrderAt,
            };
        });

        return Ok(result);
    }

    /// <summary>A single customer with their most recent bookings.</summary>
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetCustomer(long id)
    {
        var customer = await _dbContext.Users
            .Where(u => u.Id == id)
            .Select(u => new { u.Id, u.Name, u.Phone, u.Email, u.Address, u.Status, u.CreatedAt })
            .FirstOrDefaultAsync();

        if (customer == null)
            return NotFound();

        var orders = await _dbContext.Orders
            .Where(o => o.UserId == id)
            .OrderByDescending(o => o.CreatedAt)
            .Take(20)
            .Select(o => new
            {
                o.Id, o.TrackingCode, o.GrandTotal, o.DeliveryStatus,
                o.PaymentStatus, o.CreatedAt, o.LocationName, o.ShippingAddress,
            })
            .ToListAsync();

        return Ok(new { customer, orders });
    }
}
