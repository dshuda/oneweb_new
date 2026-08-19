using System.Collections.Generic;
using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Application.Common.Models;
using OneWeb.Application.Features.Vendors.DTOs;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Vendors.Queries;

public class GetVendorsQueryHandler : IRequestHandler<GetVendorsQuery, PagedResult<VendorDto>>
{
    private readonly AppDbContext _dbContext;
    
    public GetVendorsQueryHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    public async Task<PagedResult<VendorDto>> Handle(GetVendorsQuery request, CancellationToken cancellationToken)
    {
        // Query vendors, include User
        var query = _dbContext.Vendors
            .Include(v => v.User)
            .Include(v => v.VendorServices)
            .AsQueryable();
        
        // Filter by Status if provided
        if (request.Status.HasValue)
        {
            query = query.Where(v => v.Status == request.Status.Value);
        }
        
        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);
        
        // Calculate total pages
        var totalPages = (int)System.Math.Ceiling((double)totalCount / request.PageSize);
        
        // Get paginated results
        var vendors = await query
            .OrderByDescending(v => v.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);
        
        // Map to DTOs
        var items = vendors.Select(v => new VendorDto(
            v.Id,
            v.UserId,
            v.User?.Name ?? "",
            v.User?.Phone ?? "",
            v.Balance,
            v.PendingBalance,
            v.CommissionRate,
            v.TotalEarnings,
            v.Address,
            v.Status,
            v.CreatedAt,
            v.VendorServices.Select(vs => vs.ServiceId).ToList()
        )).ToList();
        
        return new PagedResult<VendorDto>(
            items, totalCount, request.Page, request.PageSize, totalPages);
    }
}
