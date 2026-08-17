using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Api.DTOs;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/customers")]
[Authorize]
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
                name = string.IsNullOrWhiteSpace(u.Name) ? (string.IsNullOrWhiteSpace(u.Phone) ? "Customer" : u.Phone) : u.Name,
                fullName = u.Name ?? string.Empty,
                email = u.Email ?? string.Empty,
                phone = u.Phone ?? string.Empty,
                address = u.Address ?? string.Empty,
                orders = stats?.Count ?? 0,
                totalOrders = stats?.Count ?? 0,
                spent = stats?.Spent ?? 0,
                totalSpent = stats?.Spent ?? 0,
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

        var recentOrdersList = orders.Take(15).Select(o => new
        {
            id = o.Id,
            trackingCode = o.TrackingCode ?? string.Empty,
            serviceName = o.Service?.Name ?? "Home Service",
            service = o.Service != null ? new { id = o.Service.Id, name = o.Service.Name } : null,
            locationName = o.ShippingAddress ?? string.Empty,
            shippingAddress = o.ShippingAddress ?? string.Empty,
            grandTotal = o.GrandTotal ?? 0,
            total = o.GrandTotal ?? 0,
            deliveryStatus = o.DeliveryStatus ?? "pending",
            paymentStatus = o.PaymentStatus ?? "unpaid",
            paymentType = o.PaymentType ?? "cod",
            createdAt = o.CreatedAt
        }).ToList();

        var result = new
        {
            id = user.Id,
            name = string.IsNullOrWhiteSpace(user.Name) ? (string.IsNullOrWhiteSpace(user.Phone) ? "Customer" : user.Phone) : user.Name,
            fullName = user.Name ?? string.Empty,
            email = user.Email ?? string.Empty,
            phone = user.Phone ?? string.Empty,
            address = user.Address ?? string.Empty,
            orders = recentOrdersList,
            totalOrders = orders.Count,
            ordersCount = orders.Count,
            orderCount = orders.Count,
            spent = totalSpent,
            totalSpent = totalSpent,
            lastOrderAt = lastOrder,
            createdAt = user.CreatedAt,
            status = user.Status && !user.IsBanned,
            isBanned = user.IsBanned
        };

        return ApiResponseFactory.Ok(result, HttpContext);
    }
}

