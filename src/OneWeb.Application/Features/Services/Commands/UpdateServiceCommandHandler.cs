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

        service.Name = request.Name;
        service.Slug = request.Slug;
        service.ParentId = request.ParentId;
        service.Level = request.Level;
        service.ServiceIcon = request.ServiceIcon;
        service.BannerImage = request.BannerImage;
        service.MetaTitle = request.HeroTitle;
        service.MetaDescription = request.HeroSubtitle;
        service.InitialPrice = request.InitialPrice;
        service.Status = request.Status;
        service.UpdatedAt = DateTime.UtcNow;

        _dbContext.Services.Update(service);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
