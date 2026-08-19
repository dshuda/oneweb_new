using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using OneWeb.Application.Common.Models;
using OneWeb.Application.Features.Vendors.Commands;
using OneWeb.Application.Features.Vendors.Queries;
using OneWeb.Api.DTOs;

namespace OneWeb.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/vendors")]
[Authorize(Roles = "admin,staff")]
public class VendorsAdminController : ControllerBase
{
    private readonly IMediator _mediator;
    
    public VendorsAdminController(IMediator mediator)
    {
        _mediator = mediator;
    }
    
    [HttpGet()]
    public async Task<IActionResult> GetVendors(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15,
        [FromQuery] bool? status = null)
    {
        var result = await _mediator.Send(new GetVendorsQuery(page, pageSize, status));
        return Ok(result);
    }
    [HttpGet("dropdown")]
    public async Task<IActionResult> GetVendorsDropDown([FromQuery] GetVendorDropdownQuery query)
    {
        var result = await _mediator.Send(query);
        return ApiResponseFactory.Ok(result, HttpContext);
    }
    




    [HttpGet("{id}")]
    public async Task<IActionResult> GetVendor(long id)
    {
        var vendor = await _mediator.Send(new GetVendorByIdQuery(id));
        
        if (vendor == null)
            return NotFound();
        
        return Ok(vendor);
    }

    [HttpPost]
    public async Task<IActionResult> SaveVendorsAsync([FromBody] RegisterVendorCommand command)
    {
        try
        {
            var id = await _mediator.Send(command);
            return Ok(new { id, message = "Vendor saved successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{Id}")]
    public async Task<IActionResult> SaveVendorsAsync(long Id, [FromBody] UpdateVendorCommand command)
    {
        try
        {
            command.Id = Id;
            var id = await _mediator.Send(command);
            return Ok(new { id, message = "Vendor updated successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }



    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateVendorStatusRequest request)
    {
        var status = request.Status.ToLower() == "active";
        var result = await _mediator.Send(new UpdateVendorStatusCommand(id, status));
        
        if (!result)
            return BadRequest(new { message = "Unable to update status" });
        
        return Ok(new { message = "Status updated" });
    }
    
    [HttpGet("{id}/withdraw-requests")]
    public async Task<IActionResult> GetWithdrawRequests(long id)
    {
        var requests = await _mediator.Send(new GetWithdrawRequestsQuery(id));
        return Ok(requests);
    }
    
    [HttpPut("withdraw-requests/{id}/approve")]
    public async Task<IActionResult> ApproveWithdrawRequest(long id, [FromBody] ApproveWithdrawRequestDto request)
    {
        var result = await _mediator.Send(new ApproveWithdrawCommand(id, request.Status, request.Note));
        
        if (!result)
            return BadRequest(new { message = "Unable to approve request" });
        
        return Ok(new { message = "Withdraw request updated" });
    }
    
    // DTOs for requests
    public record UpdateVendorStatusRequest(string Status);
    
    public record ApproveWithdrawRequestDto(string Status, string? Note);
}
