using System.Collections.Generic;
using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Application.Features.Vendors.DTOs;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Vendors.Queries;

public class GetVendorEarningsQueryHandler : IRequestHandler<GetVendorEarningsQuery, VendorEarningsDto?>
{
    private readonly AppDbContext _dbContext;
    
    public GetVendorEarningsQueryHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    public async Task<VendorEarningsDto?> Handle(GetVendorEarningsQuery request, CancellationToken cancellationToken)
    {
        // Find vendor by UserId = VendorId
        var vendor = await _dbContext.Vendors
            .FirstOrDefaultAsync(v => v.UserId == request.VendorId, cancellationToken);
        
        if (vendor == null)
            return null;
        
        // Get last 20 CommissionHistory records
        var commissions = await _dbContext.CommissionHistories
            .Where(c => c.VendorId == vendor.Id)
            .OrderByDescending(c => c.CreatedAt)
            .Take(20)
            .Select(c => new CommissionHistoryDto(
                c.OrderId,
                c.VendorAmount,
                c.CommissionAmount,
                c.CreatedAt
            ))
            .ToListAsync(cancellationToken);
        
        return new VendorEarningsDto(
            vendor.Balance,
            vendor.PendingBalance,
            vendor.TotalEarnings,
            commissions
        );
    }
}
