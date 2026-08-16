using MediatR;
using OneWeb.Application.Common.Models;

namespace OneWeb.Application.Features.Orders.Commands;

public record CancelOrderCommand(
    long OrderId,
    long UserId,
    string UserRole
) : IRequest<bool>;
