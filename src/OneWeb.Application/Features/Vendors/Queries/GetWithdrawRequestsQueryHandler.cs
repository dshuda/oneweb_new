using System.Collections.Generic;
using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Application.Features.Vendors.DTOs;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Vendors.Queries;

public class GetWithdrawRequestsQueryHandler : IRequestHandler<GetWithdrawRequestsQuery, List<VendorWithdrawRequestDto>>
{
    private readonly AppDbContext _dbContext;
    
    public GetWithdrawRequestsQueryHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    public async Task<List<VendorWithdrawRequestDto>> Handle(GetWithdrawRequestsQuery request, CancellationToken cancellationToken)
    {
        var query = _dbContext.VendorWithdrawRequests.AsQueryable();
        
        if (request.VendorId.HasValue)
        {
            query = query.Where(r => r.VendorId == request.VendorId.Value);
        }
        
        var requests = await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new VendorWithdrawRequestDto(
                r.Id,
                r.VendorId,
                r.Amount,
                r.PaymentMethod,
                r.AccountNumber,
                r.Status,
                r.Note,
                r.CreatedAt
            ))
            .ToListAsync(cancellationToken);
        
        return requests;
    }
}
