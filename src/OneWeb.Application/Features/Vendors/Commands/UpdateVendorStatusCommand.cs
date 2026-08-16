using MediatR;
using OneWeb.Application.Common.Models;

namespace OneWeb.Application.Features.Vendors.Commands;

public record UpdateVendorStatusCommand(
    long VendorId,
    bool Status
) : IRequest<bool>;
