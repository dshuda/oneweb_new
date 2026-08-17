using System.Collections.Generic;
using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Application.Features.Services.DTOs;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Services.Queries;

public class GetCategoriesQueryHandler : IRequestHandler<GetCategoriesQuery, List<ServiceDto>>
{
    private readonly AppDbContext _dbContext;
    
    public GetCategoriesQueryHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<ServiceDto>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        // Load all services to properly populate multi-level tree (Category -> SubCategory -> Services)
        var allServices = await _dbContext.Services
            .Include(s => s.Prices)
            .Where(s => request.IncludeInactive || s.Status)
            .OrderBy(s => s.Id)
            .ThenBy(s => s.Name)
            .ToListAsync(cancellationToken);

        var lookup = allServices.ToLookup(s => s.ParentId);

        ServiceDto BuildTree(OneWeb.Domain.Entities.Service service)
        {
            var children = lookup[service.Id]
                .Select(BuildTree)
                .ToList();

            return new ServiceDto(
                service.Id,
                service.Name,
                service.Slug,
                service.ParentId,
                service.Level,
                service.ServiceIcon,
                service.BannerImage,
                service.InitialPrice,
                service.IsTrending,
                service.Status,
                service.MetaTitle,
                service.MetaDescription,
                children.Count > 0 ? children : null
            );
        }

        var rootCategories = allServices
            .Where(s => s.Level == 0 || s.ParentId == null || s.ParentId == 0)
            .OrderByDescending(s => s.IsTrending)
            .ThenBy(s => s.Name)
            .Select(BuildTree)
            .ToList();

        return rootCategories;
    }
}
