using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using System.Security.Claims;
using OneWeb.Application.Features.Orders.Commands;
using OneWeb.Application.Features.Orders.Queries;

namespace OneWeb.Api.Controllers;

[ApiController]
[Route("api/v1/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrdersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private long GetUserId()
    {
        var val = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(val, out var id) ? id : 0;
    }

    private string GetUserRole() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "customer";

    [HttpGet()]
    public async Task<IActionResult> GetOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        var userId = GetUserId();
        var role = GetUserRole();
        var result = await _mediator.Send(new GetOrdersQuery(userId, role, page, pageSize));
        return Ok(result);
    }

    [HttpPost()]
    [AllowAnonymous]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var userId = GetUserId();
        if (userId <= 0)
        {
            userId = 1;
        }

        DateOnly serviceDate = DateOnly.FromDateTime(DateTime.UtcNow);
        if (!string.IsNullOrEmpty(request.ServiceDate))
        {
            var dateStr = request.ServiceDate.Contains('T') ? request.ServiceDate.Split('T')[0] : request.ServiceDate;
            if (DateOnly.TryParse(dateStr, out var parsedDate))
            {
                serviceDate = parsedDate;
            }
            else if (DateTime.TryParse(request.ServiceDate, out var dt))
            {
                serviceDate = DateOnly.FromDateTime(dt);
            }
        }

        TimeSpan? serviceTime = null;
        if (!string.IsNullOrEmpty(request.Time))
        {
            var timePart = request.Time.Contains('-') ? request.Time.Split('-')[0].Trim() : request.Time.Trim();
            if (TimeSpan.TryParse(timePart, out var parsedTime))
            {
                serviceTime = parsedTime;
            }
            else if (DateTime.TryParse(timePart, out var dt))
            {
                serviceTime = dt.TimeOfDay;
            }
        }

        var command = new CreateOrderCommand()
        {
            UserId = userId,
            PriceId = request.PriceId,
            ServiceDate = serviceDate,
            Time = serviceTime,
            ServiceId = request.ServiceId,
            ShippingAddress = request.ShippingAddress ?? "Dhaka, Bangladesh",
            AdditionalInfo = request.AdditionalInfo,
            PaymentType = request.PaymentType ?? "sslcommerz",
            CouponCode = request.CouponCode,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            OrderFrom = request.OrderFrom ?? "web"
        };

        var result = await _mediator.Send(command);

        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Created($"/api/v1/orders/{result.OrderId}", new
        {
            orderId = result.OrderId,
            trackingCode = result.TrackingCode
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrderById(long id)
    {
        var userId = GetUserId();
        var role = GetUserRole();
        var result = await _mediator.Send(new GetOrderByIdQuery(id, userId, role));

        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelOrder(long id)
    {
        var userId = GetUserId();
        var role = GetUserRole();
        var result = await _mediator.Send(new CancelOrderCommand(id, userId, role));

        if (!result)
            return BadRequest(new { message = "Unable to cancel order" });

        return Ok(new { message = "Order cancelled" });
    }

    // DTOs for requests
    public record CreateOrderRequest(
        long ServiceId,
        long PriceId,
        string? ServiceDate,
        string? Time,
        string? ShippingAddress,
        string? AdditionalInfo,
        string? PaymentType,
        string? CouponCode,
        string? Latitude,
        string? Longitude,
        string? OrderFrom
    );
}
