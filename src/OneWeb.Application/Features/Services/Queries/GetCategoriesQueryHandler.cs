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
        // Get from DB: categories (Level=0)
        var query = _dbContext.Services.Include(f=>f.Children)
            .Where(s => s.Level == 0);
        
        if (!request.IncludeInactive)
        {
            query = query.Where(s => s.Status);
        }

        var categories = await query
            .OrderByDescending(s => s.IsTrending)
            .ThenBy(s => s.Name)
            .ToListAsync(cancellationToken);
        
        // Manually load children for each category
        //foreach (var category in categories)
        //{
        //    await _dbContext.Entry(category)
        //        .Collection(c => c.Children)
        //        .LoadAsync(cancellationToken);
        //}
        
        return categories.Select(c => MapToDto(c, request.IncludeInactive)).ToList();
    }
    
    private ServiceDto MapToDto(OneWeb.Domain.Entities.Service service, bool includeInactive)
    {
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
            service.Children?
                .Where(c => includeInactive || c.Status)
                .Select(c => MapToDto(c, includeInactive))
                .ToList()
        );
    }
}
