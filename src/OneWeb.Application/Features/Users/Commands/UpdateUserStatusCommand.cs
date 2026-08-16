using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Users.Commands;

public record UpdateUserStatusCommand(long UserId, bool IsBanned) : IRequest<bool>;

public class UpdateUserStatusCommandHandler : IRequestHandler<UpdateUserStatusCommand, bool>
{
    private readonly AppDbContext _dbContext;

    public UpdateUserStatusCommandHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(UpdateUserStatusCommand request, CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
            return false;

        user.IsBanned = request.IsBanned;
        user.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
