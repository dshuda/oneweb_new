using MediatR;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Services.Commands;

public class DeleteServicePriceCommandHandler : IRequestHandler<DeleteServicePriceCommand, bool>
{
    private readonly AppDbContext _dbContext;

    public DeleteServicePriceCommandHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(DeleteServicePriceCommand request, CancellationToken cancellationToken)
    {
        var service = await _dbContext.ServicePrices.FindAsync(new object[] { request.Id }, cancellationToken);

        if (service == null)
            return false;

        _dbContext.ServicePrices.Remove(service);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
