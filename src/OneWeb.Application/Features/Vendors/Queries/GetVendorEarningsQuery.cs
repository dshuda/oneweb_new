using MediatR;
using OneWeb.Application.Features.Vendors.DTOs;

namespace OneWeb.Application.Features.Vendors.Queries;

public record GetVendorEarningsQuery(long VendorId) : IRequest<VendorEarningsDto?>;
