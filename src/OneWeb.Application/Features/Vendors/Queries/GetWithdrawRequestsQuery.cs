using MediatR;
using OneWeb.Application.Features.Vendors.DTOs;

namespace OneWeb.Application.Features.Vendors.Queries;

public record GetWithdrawRequestsQuery(long? VendorId) : IRequest<List<VendorWithdrawRequestDto>>;

