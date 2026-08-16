using System.Collections.Generic;
using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Interfaces;
using OneWeb.Domain.Entities;
using OneWeb.Application.Features.Orders.DTOs;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Orders.Commands;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, CreateOrderResult>
{
    private readonly AppDbContext _dbContext;
    private readonly IDashboardCacheService _cacheService;

    public CreateOrderCommandHandler(AppDbContext dbContext, IDashboardCacheService cacheService)
    {
        _dbContext = dbContext;
        _cacheService = cacheService;
    }

    public async Task<CreateOrderResult> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        // Validate: ServiceId exists and Status=true
        var service = await _dbContext.Services.Include(f => f.Prices).FirstOrDefaultAsync(
            s => s.Id == request.ServiceId && s.Status,
            cancellationToken);

        if (service == null)
            return new CreateOrderResult(false, null, null, "Service not found or not available");

        // ── Server-side price calculation (never trust client) ──────────────
        var basePrice = service.InitialPrice;
        if (request.PriceId > 0)
        {
            basePrice = service.Prices.Where(f => f.Id == request.PriceId)?.FirstOrDefault()?.Price ?? 0;
        }
        // If CouponCode provided: validate coupon
        Coupon? coupon = null;
        double couponDiscount = 0;
        if (!string.IsNullOrEmpty(request.CouponCode))
        {
            coupon = await _dbContext.Coupons
                .FirstOrDefaultAsync(c => c.Code == request.CouponCode && c.Status, cancellationToken);

            if (coupon != null)
            {
                if (coupon.StartDate.HasValue && coupon.StartDate > DateTime.UtcNow)
                    return new CreateOrderResult(false, null, null, "Coupon not yet active");

                if (coupon.EndDate.HasValue && coupon.EndDate < DateTime.UtcNow)
                    return new CreateOrderResult(false, null, null, "Coupon has expired");

                if (coupon.UsageLimit > 0 && coupon.UsedCount >= coupon.UsageLimit)
                    return new CreateOrderResult(false, null, null, "Coupon usage limit reached");

                // Calculate discount (percentage or fixed amount)
                couponDiscount = coupon.DiscountType == "percentage"
                    ? basePrice * (coupon.Discount / 100.0)
                    : coupon.Discount;

                // Apply max discount cap if set
                if (coupon.MaxDiscount.HasValue && couponDiscount > coupon.MaxDiscount.Value)
                    couponDiscount = coupon.MaxDiscount.Value;

                // Check minimum purchase requirement
                if (coupon.MinimumPurchase.HasValue && basePrice < coupon.MinimumPurchase.Value)
                    return new CreateOrderResult(false, null, null, $"Minimum purchase of ৳{coupon.MinimumPurchase} required for this coupon");

                // T2.3 — Per-user limit check
                var userUsageCount = await _dbContext.CouponUsages
                    .CountAsync(cu => cu.CouponId == coupon.Id && cu.UserId == request.UserId, cancellationToken);
                if (userUsageCount > 0)
                    return new CreateOrderResult(false, null, null, "You have already used this coupon");
            }
        }


        var grandTotal = Math.Max(0, basePrice - couponDiscount);

        // ── Generate collision-safe TrackingCode ────────────────────────────
        var trackingCode = $"OW-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";

        // Create Order
        var order = new Order
        {
            UserId = (int)request.UserId,
            ServiceId = request.ServiceId,
            PriceId = request.PriceId,
            ServiceDate = request.ServiceDate,
            Time = request.Time,
            // Require to add Price Id
            ShippingAddress = request.ShippingAddress,
            AdditionalInfo = request.AdditionalInfo,
            PaymentType = request.PaymentType,
            GrandTotal = grandTotal,
            CouponDiscount = couponDiscount,
            TrackingCode = trackingCode,
            DeliveryStatus = "pending",
            PaymentStatus = "unpaid",
            OrderFrom = request.OrderFrom,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Orders.Add(order);

        // Create OrderDetail
        var orderDetail = new OrderDetail
        {
            Order = order,
            ServiceId = request.ServiceId,
            Price = basePrice,
            CouponCode = request.CouponCode,
            CouponDiscount = couponDiscount,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.OrderDetails.Add(orderDetail);

        // Record coupon usage
        if (coupon != null)
        {
            coupon.UsedCount++;

            // T2.3 — Track per-user usage
            _dbContext.CouponUsages.Add(new CouponUsage
            {
                CouponId = coupon.Id,
                UserId = request.UserId,
                Order = order,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        // T4.1 — Invalidate dashboard cache
        await _cacheService.InvalidateStatsAsync();

        return new CreateOrderResult(true, order.Id, trackingCode, "Order created successfully");
    }
}
