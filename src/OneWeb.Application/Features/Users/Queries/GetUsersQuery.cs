using MediatR;
using OneWeb.Application.Common.Models;
using OneWeb.Application.Features.Users.DTOs;

namespace OneWeb.Application.Features.Users.Queries;

public record GetUsersQuery(
    int Page = 1,
    int PageSize = 15,
    string? UserType = null,
    string? Search = null
) : IRequest<PagedResult<UserDto>>;
