using MediatR;
using OneWeb.Application.Common.Models;
using OneWeb.Application.Features.Orders.DTOs;

namespace OneWeb.Application.Features.Orders.Queries;

public record GetOrdersQuery(
    long UserId,
    string UserRole,
    int Page = 1,
    int PageSize = 15
) : IRequest<PagedResult<CustomerOrderDto>>;
