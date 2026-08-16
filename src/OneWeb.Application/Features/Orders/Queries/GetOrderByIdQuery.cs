using MediatR;
using OneWeb.Application.Features.Orders.DTOs;

namespace OneWeb.Application.Features.Orders.Queries;

public record GetOrderByIdQuery(
    long OrderId,
    long UserId,
    string UserRole
) : IRequest<OrderDetailResponse?>;
