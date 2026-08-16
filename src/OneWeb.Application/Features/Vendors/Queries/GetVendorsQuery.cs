using MediatR;
using OneWeb.Application.Common.Models;
using OneWeb.Application.Features.Vendors.DTOs;

namespace OneWeb.Application.Features.Vendors.Queries;

public record GetVendorsQuery(
    int Page = 1,
    int PageSize = 15,
    bool? Status = null
) : IRequest<PagedResult<VendorDto>>;
