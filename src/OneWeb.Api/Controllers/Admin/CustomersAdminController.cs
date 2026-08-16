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
        var customers = await _dbContext.Users
            .Where(u => u.UserType == "customer")
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                id = u.Id,
                name = u.Name,
                email = u.Email,
                phone = u.Phone,
                address = u.Address,
                orders = _dbContext.Orders.Count(o => o.UserId == u.Id),
                spent = (decimal)(_dbContext.Orders.Where(o => o.UserId == u.Id).Sum(o => (double?)o.GrandTotal) ?? 0),
                lastOrderAt = _dbContext.Orders.Where(o => o.UserId == u.Id).Max(o => o.CreatedAt),
                createdAt = u.CreatedAt,
                status = u.Status && !u.IsBanned
            })
            .ToListAsync();

        return ApiResponseFactory.Ok(customers, HttpContext);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(long id)
    {
        var customer = await _dbContext.Users
            .Where(u => u.Id == id && u.UserType == "customer")
            .Select(u => new
            {
                id = u.Id,
                name = u.Name,
                email = u.Email,
                phone = u.Phone,
                address = u.Address,
                orders = _dbContext.Orders.Count(o => o.UserId == u.Id),
                spent = (decimal)(_dbContext.Orders.Where(o => o.UserId == u.Id).Sum(o => (double?)o.GrandTotal) ?? 0),
                lastOrderAt = _dbContext.Orders.Where(o => o.UserId == u.Id).Max(o => o.CreatedAt),
                createdAt = u.CreatedAt,
                status = u.Status && !u.IsBanned,
                recentOrders = _dbContext.Orders
                    .Where(o => o.UserId == u.Id)
                    .OrderByDescending(o => o.CreatedAt)
                    .Take(10)
                    .Select(o => new
                    {
                        id = o.Id,
                        trackingCode = o.TrackingCode,
                        shippingAddress = o.ShippingAddress,
                        grandTotal = o.GrandTotal,
                        deliveryStatus = o.DeliveryStatus,
                        paymentStatus = o.PaymentStatus,
                        createdAt = o.CreatedAt
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        if (customer == null)
            return NotFound();

        return ApiResponseFactory.Ok(customer, HttpContext);
    }
}
