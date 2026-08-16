using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Application.Common.Models;
using OneWeb.Application.Features.Orders.DTOs;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Orders.Queries;


public class GetAdminOrdersQuery : IRequest<PagedResult<OrderAdminDto>>
{
  public  long UserId { get; set; }
  public  string UserRole { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 15;
    public GetAdminOrdersQuery(long userId, string role, int page, int pageSize)
    {
        UserId = userId;
        UserRole = role;
        Page = page;
        PageSize = PageSize;
    }
}


public class GetAdminOrdersQueryHandler : IRequestHandler<GetAdminOrdersQuery, PagedResult<OrderAdminDto>>
{
    private readonly AppDbContext _dbContext;
    
    public GetAdminOrdersQueryHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    public async Task<PagedResult<OrderAdminDto>> Handle(GetAdminOrdersQuery request, CancellationToken cancellationToken)
    {
        // Build query based on role
        var query = _dbContext.Orders.Include(f=>f.User).Include(f=>f.Service).ThenInclude(s=>s.Prices).AsQueryable();
        
        if (request.UserRole == "vendor")
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

        // Map to DTOs
        var vendorIds = orders.Where(o => o.VendorId.HasValue).Select(o => o.VendorId!.Value).Distinct().ToList();
        var vendorMap = await _dbContext.Vendors
            .Include(v => v.User)
            .Where(v => vendorIds.Contains(v.Id))
            .ToDictionaryAsync(v => v.Id, v => new
            {
                Name = v.User != null ? v.User.Name : "Vendor",
                Phone = v.User != null ? v.User.Phone : ""
            }, cancellationToken);

        var items = orders.Select(o => new OrderAdminDto()
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
            VendorId = o.VendorId,
            Vendor = o.VendorId.HasValue && vendorMap.TryGetValue(o.VendorId.Value, out var vInfo) ? vInfo.Name : null,
            VendorContact = o.VendorId.HasValue && vendorMap.TryGetValue(o.VendorId.Value, out var vInfo2) ? vInfo2.Phone : null,
            PriceId = o.PriceId,
            Customer = o.User != null ? o.User.Name + " - " + o.User.Phone : null,
            Service = o.Service != null ? new ServiceSummaryDto(o.Service.Id, o.Service.Name, o.Service.Slug) : null,
            OrderFrom = o.OrderFrom ?? null,
            Pricing = o.Service?.Prices.Select(f => new PricingDto() { Id = f.Id, Name = f.Name, Price = f.Price, Selected = f.Id == o.PriceId }).ToList(),
        }).ToList();
        
        return new PagedResult<OrderAdminDto>(
            items, totalCount, request.Page, request.PageSize, totalPages);
    }
}
