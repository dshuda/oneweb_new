using MediatR;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Services.Commands;

public class UpdateServicePriceCommand: IRequest<bool>
{
    public long Id { get; set; }
    public long ServiceId { get; set; }
    public double Price { get; set; }
    public string Name { get; set; }
    public bool Status { get; set; }
}
public class UpdateServicePriceCommandHandler : IRequestHandler<UpdateServicePriceCommand, bool>
{
    private readonly AppDbContext _dbContext;

    public UpdateServicePriceCommandHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(UpdateServicePriceCommand request, CancellationToken cancellationToken)
    {
        var price = await _dbContext.ServicePrices.FindAsync(new object[] { request.Id }) ;
        if (price == null) return false;
        price.Price = request.Price;
        price.Status = request.Status;
        price.ServiceId = request.ServiceId;
        price.Name = request.Name;

        _dbContext.Entry(price).State = Microsoft.EntityFrameworkCore.EntityState.Modified;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
