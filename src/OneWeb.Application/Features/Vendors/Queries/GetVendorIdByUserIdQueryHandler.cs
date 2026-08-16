using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Vendors.Queries;

public class GetVendorIdByUserIdQueryHandler : IRequestHandler<GetVendorIdByUserIdQuery, long>
{
    private readonly AppDbContext _dbContext;
    
    public GetVendorIdByUserIdQueryHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    public async Task<long> Handle(GetVendorIdByUserIdQuery request, CancellationToken cancellationToken)
    {
        var vendor = await _dbContext.Vendors
            .FirstOrDefaultAsync(v => v.UserId == request.UserId, cancellationToken);
        
        return vendor?.Id ?? 0;
    }
}
