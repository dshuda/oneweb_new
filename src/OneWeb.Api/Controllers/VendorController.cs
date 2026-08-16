using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneWeb.Application.Features.Orders.Queries;
using OneWeb.Application.Features.Vendors.Commands;
using OneWeb.Application.Features.Vendors.Queries;

namespace OneWeb.Api.Controllers;

[ApiController]
[Route("api/v1/vendor")]
[Authorize(Roles = "vendor")]
public class VendorController : ControllerBase
{
    private readonly IMediator _mediator;
    
    public VendorController(IMediator mediator)
    {
        _mediator = mediator;
    }
    
    private long GetUserId() =>
        long.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);


    [HttpGet("pendings")]
    public async Task<IActionResult> PendingOrders()
    {
        var userId = GetUserId();
        var vendorId = await _mediator.Send(new GetVendorIdByUserIdQuery(userId));
        var pending = await _mediator.Send(new GetVendorPendingOrdersQuery() { VendorId = vendorId });

        return Ok(pending);
    }


    [HttpGet("my-works")]
    public async Task<IActionResult> MyOrders()
    {
        var userId = GetUserId();
        var vendorId = await _mediator.Send(new GetVendorIdByUserIdQuery(userId));
        var proccessing = await _mediator.Send(new GetVendorProccessingOrdersQuery() { VendorId = vendorId });
        return Ok(proccessing);
    }

    [HttpPost("assign-me")]
    public async Task<IActionResult> AssignMySelf([FromBody] AssignMeDTO dto)
    {
        var userId = GetUserId();
        var vendorId = await _mediator.Send(new GetVendorIdByUserIdQuery(userId));
        await _mediator.Send(new AssignMeToOrderCommand() { OrderId = dto.OrderId, VendorId = vendorId });
        return Ok();
    }


    [HttpGet("earnings")]
    public async Task<IActionResult> GetEarnings()
    {
        var userId = GetUserId();
        var result = await _mediator.Send(new GetVendorEarningsQuery(userId));
        
        if (result == null)
            return NotFound();
        
        return Ok(result);
    }
    
    [HttpPost("withdraw-requests")]
    public async Task<IActionResult> CreateWithdrawRequest([FromBody] WithdrawRequestDto request)
    {
        var userId = GetUserId();
        var vendorId = await _mediator.Send(new GetVendorIdByUserIdQuery(userId));
        
        if (vendorId == 0)
            return BadRequest(new { message = "Vendor not found" });
        
        var command = new CreateWithdrawRequestCommand(
            vendorId,
            request.Amount,
            request.PaymentMethod,
            request.AccountNumber
        );
        
        var requestId = await _mediator.Send(command);
        
        if (requestId == 0)
            return BadRequest(new { message = "Unable to create withdraw request" });
        
        return Created($"/api/v1/vendor/withdraw-requests/{requestId}", new { requestId });
    }
    
    public record WithdrawRequestDto(
        double Amount,
        string PaymentMethod,
        string AccountNumber
    );
    public record AssignMeDTO
    {
        public long OrderId { get; set; }
    }
}

// ─── Customer Controller ─────────────────────────────────────────────────────
// Handles customer-specific actions, including becoming a vendor.
// T1.3 Fix: register was previously inside VendorController with conflicting roles.
[ApiController]
[Route("api/v1/customer")]
[Authorize(Roles = "customer")]
public class CustomerController : ControllerBase
{
    private readonly IMediator _mediator;
    
    public CustomerController(IMediator mediator)
    {
        _mediator = mediator;
    }
    
    private long GetUserId() =>
        long.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);
    
    /// <summary>POST /api/v1/customer/become-vendor</summary>
    [HttpPost("become-vendor")]
    public async Task<IActionResult> BecomeVendor([FromBody] RegisterVendorCommand command)
    {
        var userId = GetUserId();
    
        var vendorId = await _mediator.Send(command);
        return Created($"/api/v1/vendor/{vendorId}", new { vendorId });
    }
    
    
}
