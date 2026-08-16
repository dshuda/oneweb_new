using MediatR;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Services.Commands;

public record ServiceContentCommand : IRequest<bool>
{
  public  long Id {get;set;}
    public string? About { get; set; } // Allow Html Content
    public string? FAQ { get; set; } // Allow html Content
    public string? Detail { get; set; } // Allow Html content
}
public class ServiceContentCommandHandler : IRequestHandler<ServiceContentCommand, bool>
{
    private readonly AppDbContext _dbContext;
    public ServiceContentCommandHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<bool> Handle(ServiceContentCommand request, CancellationToken cancellationToken)
    {
        var service = await _dbContext.Services.FindAsync(new object[] { request.Id }, cancellationToken);

        if (service == null || service.Level != 1)
            return false;

        service.About = request.About;
        service.FAQ = request.FAQ;
        service.Detail = request.Detail;

        _dbContext.Services.Update(service);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
