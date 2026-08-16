using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Application.Features.Services.DTOs;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Services.Queries;


public class GetAdminCategoriesQuery : IRequest<List<ServiceAdminDto>>
{

}

public class GetAdminCategoriesQueryHandler : IRequestHandler<GetAdminCategoriesQuery, List<ServiceAdminDto>>
{
    private readonly AppDbContext _dbContext;
    
    public GetAdminCategoriesQueryHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<ServiceAdminDto>> Handle(GetAdminCategoriesQuery request, CancellationToken cancellationToken)
    {
        // Get from DB: categories (Level=0)
        var query = _dbContext.Services.Include(f=>f.Children)
            .ThenInclude(s=>s.Children)
            .ThenInclude(f=>f.Prices)
            .Where(s => s.Level == 0);

        var categories = await query
            .OrderByDescending(s => s.IsTrending)
            .ThenBy(s => s.Name)
            .ToListAsync(cancellationToken);
       
        
        return categories.Select(c => MapToDto(c)).ToList();
    }
    
    private ServiceAdminDto MapToDto(OneWeb.Domain.Entities.Service service)
    {
        return new ServiceAdminDto(
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
             service.Prices?.Select(p => new ServicePriceAdminDto(p.Id, p.Name, p.Price, p.Status)).ToList(),
            service.Children?.Select(c => MapToDto(c)).ToList()
        );
    }
}
