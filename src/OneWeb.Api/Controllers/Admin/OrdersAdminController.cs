using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneWeb.Api.DTOs;
using OneWeb.Application.Features.Orders.Commands;
using OneWeb.Application.Features.Orders.Queries;

namespace OneWeb.Api.Controllers;

[ApiController]
[Route("api/v1/admin/orders")]
[Authorize(Roles = "vendor,admin,staff")]
public class OrdersAdminController : ControllerBase
{
    private readonly IMediator _mediator;
    public OrdersAdminController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private long GetUserId() =>
        long.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);

    private string GetUserRole() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value!;

    [HttpGet]
    public async Task<IActionResult> GetOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        var userId = GetUserId();
        var role = GetUserRole();
        var result = await _mediator.Send(new GetAdminOrdersQuery(userId, role, page, pageSize));
        return ApiResponseFactory.Ok(result, HttpContext);
    }


    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrderById(long id)
    {
        var userId = GetUserId();
        var role = GetUserRole();
        var result = await _mediator.Send(new GetOrderByIdQuery(id, userId, role));

        if (result == null)
            return NotFound();

        return ApiResponseFactory.Ok(result, HttpContext);
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelOrder(long id)
    {
        var userId = GetUserId();
        var role = GetUserRole();
        var result = await _mediator.Send(new CancelOrderCommand(id, userId, role));

        if (!result)
            return BadRequest(new { message = "Unable to cancel order" });

        return ApiResponseFactory.Accepted(result, HttpContext);
    }

    [HttpPost("{id}/status")]

    public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateStatusRequest request)
    {
        var userId = GetUserId();
        var role = GetUserRole();
        var result = await _mediator.Send(new UpdateOrderStatusCommand(id, request.NewStatus, userId, role));

        if (!result)
            return BadRequest(new { message = "Invalid status transition" });

        return ApiResponseFactory.Accepted(result, HttpContext);
    }

    [HttpPut("{id}")]

    public async Task<IActionResult> UpdateOrder(long id, [FromBody] UpdateOrderCommand request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.Select(f => f.Errors.SelectMany(s => s.ErrorMessage)).ToArray();
            return BadRequest(errors);
        }
        var userId = GetUserId();
        var role = GetUserRole();
        request.UpdatedByRole = role;
        var result = await _mediator.Send(request);

        if (!result)
            return BadRequest(new { message = "Invalid status transition" });

        return ApiResponseFactory.Accepted(result, HttpContext);
    }

    public record UpdateStatusRequest(string NewStatus);
}
