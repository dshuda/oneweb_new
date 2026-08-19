using MediatR;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Services.Commands;

public class CreateServiceCommandHandler : IRequestHandler<CreateServiceCommand, long>
{
    private readonly AppDbContext _dbContext;

    public CreateServiceCommandHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<long> Handle(CreateServiceCommand request, CancellationToken cancellationToken)
    {
        var service = new Service
        {
            Name = request.Name,
            Slug = request.Slug ?? request.Name.ToLower().Replace(" ", "-"),
            ParentId = request.ParentId,
            Level = request.Level,
            BannerImage = request.BannerImage,
            ServiceIcon = request.ServiceIcon,
            PriceUnit = request.PriceUnit,
            Rating = request.Rating,
            ReviewCount = request.ReviewCount,
            HeroTitle = request.HeroTitle,
            HeroSubtitle = request.HeroSubtitle,
            InitialPrice = request.InitialPrice,
            Status = request.Status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Services.Add(service);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return service.Id;
    }
}
