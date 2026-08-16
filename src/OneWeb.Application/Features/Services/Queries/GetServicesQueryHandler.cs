using System.Collections.Generic;
using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Application.Common.Models;
using OneWeb.Application.Features.Services.DTOs;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Services.Queries;

public class GetServicesQueryHandler : IRequestHandler<GetServicesQuery, PagedResult<ServiceDto>>
{
    private readonly AppDbContext _dbContext;
    
    public GetServicesQueryHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    public async Task<PagedResult<ServiceDto>> Handle(GetServicesQuery request, CancellationToken cancellationToken)
    {
        // Query services where Level=2 AND Status=true
        var query = _dbContext.Services
            .Where(s => s.Level == 2 && s.Status);

        // If Search: filter by Name.Contains(search)
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var searchTerms = request.Search
                .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            foreach (var term in searchTerms)
            {
                var localTerm = term;

                query = query.Where(s =>
                    EF.Functions.ILike(s.Name, $"%{localTerm}%"));
            }
        }

        // If CategoryId: need to find root category and filter
        if (request.CategoryId.HasValue)
        {
            // Get all subcategories of the given category
            var subCategoryIds = await _dbContext.Services
                .Where(s => s.ParentId == request.CategoryId && s.Level == 1)
                .Select(s => s.Id)
                .ToListAsync(cancellationToken);
            
            query = query.Where(s => (s.ParentId != null && subCategoryIds.Contains((long)s.ParentId)));
        }
        
        // OrderBy IsTrending descending, then Name
        query = query
            .OrderByDescending(s => s.IsTrending)
            .ThenBy(s => s.Name);
        
        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);
        
        // Calculate total pages
        var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);
        
        // Skip/Take for pagination
        var services = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);
        
        // Map to ServiceDto (without children for list)
        var items = services.Select(s => new ServiceDto(
            s.Id, s.Name, s.Slug, s.ParentId, s.Level,
            s.ServiceIcon, s.BannerImage, s.InitialPrice, s.IsTrending, s.Status
        )).ToList();
        
        return new PagedResult<ServiceDto>(
            items, totalCount, request.Page, request.PageSize, totalPages);
    }
}
