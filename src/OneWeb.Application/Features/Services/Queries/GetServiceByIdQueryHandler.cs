using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Application.Features.Services.DTOs;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Services.Queries;

public class GetServiceByIdQueryHandler : IRequestHandler<GetServiceByIdQuery, ServiceDetailOutDto?>
{
    private readonly AppDbContext _dbContext;
    
    public GetServiceByIdQueryHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    public async Task<ServiceDetailOutDto?> Handle(GetServiceByIdQuery request, CancellationToken cancellationToken)
    {
        // Query from DB with includes
        var service = await _dbContext.Services
            .Include(s => s.Prices)
            .Include(f=>f.Parent)
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);
        
        if (service == null)
            return null;

        // Map to DTO
        return new ServiceDetailOutDto()
        {
            Id = service.Id,
            Name = service.Name,
            Slug = service.Slug,
            About = service.About,
            ServiceQuality = service.ServiceQuality,
            MetaTitle = service.MetaTitle,
            MetaKeywords = service.MetaKeywords,
            MetaDescription = service.MetaDescription,
            BannerImage = service.BannerImage,
            Prices = service.Prices.Where(p => p.Status).Select(p => new ServicePriceDto(p.Id, p.Name, p.Price)).ToList(),
            // service.Schedules.Where(s => s.Status).Select(s => new ServiceScheduleDto(s.Id, s.Day, s.StartTime, s.EndTime)).ToList()
        };
    }
}
