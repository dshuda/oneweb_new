using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneWeb.Api.DTOs;
using OneWeb.Application.Features.Users.Commands;
using OneWeb.Application.Features.Users.Queries;

namespace OneWeb.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/users")]
[Authorize(Roles = "admin,staff")]
public class UsersAdminController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersAdminController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet()]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15,
        [FromQuery] string? userType = null,
        [FromQuery] string? search = null)
    {
        var result = await _mediator.Send(new GetUsersQuery(page, pageSize, userType, search));
        return ApiResponseFactory.Ok(result, HttpContext);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetUser(long id)
    {
        var user = await _mediator.Send(new GetUserByIdQuery(id));
        
        if (user == null)
            return NotFound();

        return ApiResponseFactory.Ok(user, HttpContext);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateStatusRequest request)
    {
        var result = await _mediator.Send(new UpdateUserStatusCommand(id, request.IsBanned));
        
        if (!result)
            return NotFound();

        return ApiResponseFactory.Accepted(result, HttpContext);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(long id)
    {
        var result = await _mediator.Send(new DeleteUserCommand(id));
        
        if (!result)
            return NotFound();

        return ApiResponseFactory.Accepted(result, HttpContext);
    }

    public record UpdateStatusRequest(bool IsBanned);
}
