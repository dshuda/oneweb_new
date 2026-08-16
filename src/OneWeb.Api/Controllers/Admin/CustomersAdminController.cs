using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Api.DTOs;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api.Controllers.Admin;

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
    public async Task<IActionResult> GetAll()
    {
        var users = await _dbContext.Users
            .Where(u => u.UserType == "customer" || u.UserType == "Customer" || string.IsNullOrEmpty(u.UserType))
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        var customerIds = users.Select(u => u.Id).ToList();
        var allOrders = await _dbContext.Orders
            .Where(o => customerIds.Contains(o.UserId))
            .Select(o => new { o.UserId, o.GrandTotal, o.CreatedAt })
            .ToListAsync();

        var ordersByCustomer = allOrders.GroupBy(o => o.UserId).ToDictionary(
            g => g.Key,
            g => new
            {
                Count = g.Count(),
                Spent = g.Sum(o => o.GrandTotal ?? 0),
                LastOrder = g.Max(o => (DateTime?)o.CreatedAt)
            }
        );

        var customers = users.Select(u =>
        {
            ordersByCustomer.TryGetValue(u.Id, out var stats);
            return new
            {
                id = u.Id,
                name = u.Name,
                email = u.Email,
                phone = u.Phone,
                address = u.Address,
                orders = stats?.Count ?? 0,
                spent = stats?.Spent ?? 0,
                lastOrderAt = stats?.LastOrder,
                createdAt = u.CreatedAt,
                status = u.Status && !u.IsBanned
            };
        }).ToList();

        return ApiResponseFactory.Ok(customers, HttpContext);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(long id)
    {
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return NotFound(new { message = "Customer not found" });

        var orders = await _dbContext.Orders
            .Include(o => o.Service)
            .Where(o => o.UserId == id)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var totalSpent = orders.Sum(o => o.GrandTotal ?? 0);
        var lastOrder = orders.FirstOrDefault()?.CreatedAt;

        var result = new
        {
            id = user.Id,
            name = user.Name,
            email = user.Email,
            phone = user.Phone,
            address = user.Address,
            orders = orders.Count,
            spent = totalSpent,
            lastOrderAt = lastOrder,
            createdAt = user.CreatedAt,
            status = user.Status && !user.IsBanned,
            recentOrders = orders.Take(10).Select(o => new
            {
                id = o.Id,
                trackingCode = o.TrackingCode ?? string.Empty,
                serviceName = o.Service?.Name ?? "Service",
                service = o.Service != null ? new { id = o.Service.Id, name = o.Service.Name } : null,
                shippingAddress = o.ShippingAddress ?? string.Empty,
                grandTotal = o.GrandTotal ?? 0,
                total = o.GrandTotal ?? 0,
                deliveryStatus = o.DeliveryStatus ?? "pending",
                paymentStatus = o.PaymentStatus ?? "unpaid",
                createdAt = o.CreatedAt
            }).ToList()
        };

        return ApiResponseFactory.Ok(result, HttpContext);
    }
}

