using MediatR;
using OneWeb.Application.Features.Users.DTOs;

namespace OneWeb.Application.Features.Users.Queries;

public record GetUserByIdQuery(long Id) : IRequest<UserDetailDto?>;
