using MediatR;
using OneWeb.Application.Common.Models;

namespace OneWeb.Application.Features.Orders.Commands;

public record UpdateOrderStatusCommand(
    long OrderId,
    string NewStatus,
    long UpdatedByUserId,
    string UpdatedByRole
) : IRequest<bool>;
