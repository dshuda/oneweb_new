using MediatR;
using OneWeb.Application.Common.Models;

namespace OneWeb.Application.Features.Vendors.Commands;

public record ApproveWithdrawCommand(
    long RequestId,
    string Status,
    string? Note
) : IRequest<bool>;
