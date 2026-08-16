using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Application.Features.Users.DTOs;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Users.Queries;

public class GetUserByIdQueryHandler : IRequestHandler<GetUserByIdQuery, UserDetailDto?>
{
    private readonly AppDbContext _dbContext;

    public GetUserByIdQueryHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<UserDetailDto?> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);

        if (user == null)
            return null;

        return new UserDetailDto(
            user.Id,
            user.Name,
            user.Email,
            user.Phone,
            user.UserType,
            user.Gender,
            user.Address,
            user.ImageId,
            user.Status,
            user.IsApproved,
            user.IsBanned,
            user.CreatedAt,
            user.UpdatedAt
        );
    }
}
