using MediatR;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Services.Commands;

public class CreateServicePriceCommandHandler : IRequestHandler<CreateServicePriceCommand, long>
{
    private readonly AppDbContext _dbContext;

    public CreateServicePriceCommandHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<long> Handle(CreateServicePriceCommand request, CancellationToken cancellationToken)
    {
        var price = new ServicePrice
        {
            Name = request.Name,
            Price = request.Price,
            ServiceId = request.ServiceId,
            Status = true,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.ServicePrices.Add(price);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return price.Id;
    }
}
