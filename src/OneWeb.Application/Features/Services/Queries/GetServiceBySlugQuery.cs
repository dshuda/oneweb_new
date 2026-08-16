using MediatR;
using OneWeb.Application.Features.Services.DTOs;

namespace OneWeb.Application.Features.Services.Queries;

public record GetServiceBySlugQuery(string Slug) : IRequest<ServiceDetailOutDto?>;
