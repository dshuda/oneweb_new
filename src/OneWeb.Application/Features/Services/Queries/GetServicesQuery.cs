using MediatR;
using OneWeb.Application.Common.Models;
using OneWeb.Application.Features.Services.DTOs;

namespace OneWeb.Application.Features.Services.Queries;

public record GetServicesQuery(
    int Page = 1, 
    int PageSize = 15, 
    string? Search = null, 
    int? CategoryId = null
) : IRequest<PagedResult<ServiceDto>>;
