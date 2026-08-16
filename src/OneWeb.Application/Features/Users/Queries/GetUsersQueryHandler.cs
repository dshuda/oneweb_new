using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Application.Common.Models;
using OneWeb.Application.Features.Users.DTOs;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Users.Queries;

public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, PagedResult<UserDto>>
{
    private readonly AppDbContext _dbContext;

    public GetUsersQueryHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResult<UserDto>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var query = _dbContext.Users.AsQueryable();

        if (!string.IsNullOrEmpty(request.UserType))
        {
            query = query.Where(u => u.UserType == request.UserType);
        }

        if (!string.IsNullOrEmpty(request.Search))
        {
            query = query.Where(u => 
                (u.Name != null && u.Name.Contains(request.Search)) ||
                (u.Phone != null && u.Phone.Contains(request.Search)) ||
                (u.Email != null && u.Email.Contains(request.Search)));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(u => new UserDto(
                u.Id,
                u.Name,
                u.Email,
                u.Phone,
                u.UserType,
                u.Status,
                u.IsApproved,
                u.IsBanned,
                u.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return new PagedResult<UserDto>(users, totalCount, request.Page, request.PageSize, totalPages);
    }
}
