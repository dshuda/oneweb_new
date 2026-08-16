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
            ServiceIcon = request.ServiceIcon,
            BannerImage = request.BannerImage,
            MetaTitle = request.HeroTitle,
            MetaDescription = request.HeroSubtitle,
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
