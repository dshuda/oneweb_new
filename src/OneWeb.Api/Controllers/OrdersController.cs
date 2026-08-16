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
    [Authorize]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var userId = GetUserId();
        if (userId <= 0)
            return Unauthorized(new { message = "User session expired or invalid. Please login again." });

        var command = new CreateOrderCommand()
        {
            UserId = userId,
            PriceId = request.PriceId,
            ServiceDate = request.ServiceDate,
            Time = request.Time,
            ServiceId = request.ServiceId,
            ShippingAddress = request.ShippingAddress,
            AdditionalInfo = request.AdditionalInfo,
            PaymentType = request.PaymentType,
            CouponCode = request.CouponCode,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            OrderFrom = request.OrderFrom
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
        int ServiceId,
        int PriceId,
        DateOnly ServiceDate,
        TimeSpan Time,
        string ShippingAddress,
        string? AdditionalInfo,
        string? PaymentType,
        string? CouponCode,
        string? Latitude,
        string? Longitude,
        string OrderFrom = "web"
    );

}
