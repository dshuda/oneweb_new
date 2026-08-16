using MediatR;
using OneWeb.Application.Features.Services.DTOs;

namespace OneWeb.Application.Features.Services.Queries;

public record GetCategoriesQuery(bool IncludeInactive = false) : IRequest<List<ServiceDto>>;
