using MediatR;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Services.Commands;

public class DeleteServiceCommandHandler : IRequestHandler<DeleteServiceCommand, bool>
{
    private readonly AppDbContext _dbContext;

    public DeleteServiceCommandHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(DeleteServiceCommand request, CancellationToken cancellationToken)
    {
        var service = await _dbContext.Services.FindAsync(new object[] { request.Id }, cancellationToken);

        if (service == null)
            return false;

        _dbContext.Services.Remove(service);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}
