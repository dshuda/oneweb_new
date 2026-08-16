using System.Collections.Generic;
using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Application.Features.Services.DTOs;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Services.Queries;

public class GetServiceBySlugQueryHandler : IRequestHandler<GetServiceBySlugQuery, ServiceDetailOutDto?>
{
    private readonly AppDbContext _dbContext;

    public GetServiceBySlugQueryHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ServiceDetailOutDto?> Handle(GetServiceBySlugQuery request, CancellationToken cancellationToken)
    {
        // Query from DB with includes
        var service = await _dbContext.Services
            .Include(s => s.Prices)
            .Include(f=>f.Parent)
            .FirstOrDefaultAsync(s => s.Slug == request.Slug, cancellationToken);

        if (service == null)
            return null;
        var cms = new { About = service?.Parent?.About ?? string.Empty, Detail = service?.Parent?.Detail ?? string.Empty, FAQ = service?.Parent?.FAQ ?? string.Empty };
        // Map to DTO
        return new ServiceDetailOutDto()
        {
            Id = service.Id,
            Name = service.Name,
            Slug = service.Slug,
            About = service.About,
            BannerImage = service.Parent?.BannerImage ?? string.Empty,
            ServiceQuality = service.ServiceQuality,
            MetaTitle = service.MetaTitle,
            MetaKeywords = service.MetaKeywords,
            MetaDescription = service.MetaDescription,
            CMS = cms,
            Prices = service.Prices.Where(p => p.Status).Select(p => new ServicePriceDto(p.Id, p.Name, p.Price)).ToList(),
          //  Schedules = service.Schedules.Where(s => s.Status).Select(s => new ServiceScheduleDto(s.Id, s.Day, s.StartTime, s.EndTime)).ToList()
        };
    }
}
