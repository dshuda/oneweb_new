using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Application.Common.Models;
using OneWeb.Application.Features.Orders.DTOs;
using OneWeb.Infrastructure.Persistence;
using OneWeb.Domain.Entities;
namespace OneWeb.Application.Features.Orders.Queries;

public class GetOrdersQueryHandler : IRequestHandler<GetOrdersQuery, PagedResult<CustomerOrderDto>>
{
    private readonly AppDbContext _dbContext;
    
    public GetOrdersQueryHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    public async Task<PagedResult<CustomerOrderDto>> Handle(GetOrdersQuery request, CancellationToken cancellationToken)
    {
        // Build query based on role
        var query = _dbContext.Orders.Include(f=>f.Service).AsQueryable();
        
        if (request.UserRole == "customer")
        {
            query = query.Where(o => o.UserId == request.UserId);
        }
        else if (request.UserRole == "vendor")
        {
            query = query.Where(o => o.VendorId == request.UserId);
        }
        // Admin and staff can see all orders
        
        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);
        
        // Calculate total pages
        var totalPages = (int)System.Math.Ceiling((double)totalCount / request.PageSize);
        
        // Get paginated results
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var vendids = orders.Select(f => f.VendorId).ToArray();
        var vendors = await _dbContext.Users.Where(f => vendids.Contains(f.Id)).ToDictionaryAsync(s => s.Id, cancellationToken);

        // Map to DTOs
        var items = orders.Select(o =>
        {
            vendors.TryGetValue(o.VendorId ?? 0, out var vendor);
            return new CustomerOrderDto()
            {
                Id = o.Id,
                TrackingCode = o.TrackingCode,
                DeliveryStatus = o.DeliveryStatus,
                PaymentStatus = o.PaymentStatus,
                PaymentType = o.PaymentType,
                GrandTotal = o.GrandTotal,
                CouponDiscount = o.CouponDiscount,
                ShippingAddress = o.ShippingAddress,
                AdditionalInfo = o.AdditionalInfo,
                CreatedAt = o.CreatedAt,
                Customer = o.User != null ? o.User.Name + " -" + o.User.Phone : null,
                Service = o.Service != null ? new ServiceSummaryDto(o.Service.Id, o.Service.Name, o.Service.Slug) : null,
                OrderFrom = o.OrderFrom,
                Vendor = vendor?.Name,
                VendorContact = vendor?.Phone
            };
        }).ToList();
        
        return new PagedResult<CustomerOrderDto>(
            items, totalCount, request.Page, request.PageSize, totalPages);
    }
}
