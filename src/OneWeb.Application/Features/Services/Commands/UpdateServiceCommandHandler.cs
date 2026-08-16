using MediatR;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Services.Commands;

public class UpdateServiceCommandHandler : IRequestHandler<UpdateServiceCommand, bool>
{
    private readonly AppDbContext _dbContext;

    public UpdateServiceCommandHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(UpdateServiceCommand request, CancellationToken cancellationToken)
    {
        var service = await _dbContext.Services.FindAsync(new object[] { request.Id }, cancellationToken);

        if (service == null)
            return false;

        if (!string.IsNullOrWhiteSpace(request.Name))
            service.Name = request.Name;

        if (!string.IsNullOrWhiteSpace(request.Slug))
        {
            service.Slug = request.Slug;
        }
        else if (string.IsNullOrWhiteSpace(service.Slug) && !string.IsNullOrWhiteSpace(service.Name))
        {
            service.Slug = request.Name.ToLower().Replace(" ", "-");
        }

        if (request.ParentId.HasValue)
            service.ParentId = request.ParentId;

        if (request.Level > 0)
            service.Level = request.Level;

        if (request.ServiceIcon != null)
            service.ServiceIcon = request.ServiceIcon;

        if (request.BannerImage != null)
            service.BannerImage = request.BannerImage;

        if (request.HeroTitle != null)
            service.MetaTitle = request.HeroTitle;

        if (request.HeroSubtitle != null)
            service.MetaDescription = request.HeroSubtitle;

        if (request.InitialPrice > 0)
            service.InitialPrice = request.InitialPrice;

        service.Status = request.Status;
        service.UpdatedAt = DateTime.UtcNow;

        _dbContext.Services.Update(service);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
