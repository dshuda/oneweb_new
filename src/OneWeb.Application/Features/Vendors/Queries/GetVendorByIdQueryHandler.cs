using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Application.Features.Vendors.DTOs;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Vendors.Queries;

public class GetVendorByIdQueryHandler : IRequestHandler<GetVendorByIdQuery, VendorDto?>
{
    private readonly AppDbContext _dbContext;
    
    public GetVendorByIdQueryHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    public async Task<VendorDto?> Handle(GetVendorByIdQuery request, CancellationToken cancellationToken)
    {
        var vendor = await _dbContext.Vendors
            .Include(v => v.User)
            .FirstOrDefaultAsync(v => v.Id == request.Id, cancellationToken);
        
        if (vendor == null)
            return null;
        
        return new VendorDto(
            vendor.Id,
            vendor.UserId,
            vendor.User?.Name ?? "",
            vendor.User?.Phone ?? "",
            vendor.Balance,
            vendor.PendingBalance,
            vendor.CommissionRate,
            vendor.TotalEarnings,
            vendor.Address,
            vendor.Status,
            vendor.CreatedAt
        );
    }
}
