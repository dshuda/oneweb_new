using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Api.DTOs;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;


namespace OneWeb.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/coupons")]
[Authorize(Roles = "admin,staff")]
public class CouponAdminController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public CouponAdminController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Public: GET /api/v1/sliders
    [HttpGet()]
    public async Task<IActionResult> GetAll()
    {
        var coupons = await _dbContext.Coupons
            .OrderBy(s => s.Id)
            .Select(s => new
            {

                s.Status,
                s.MaxDiscount,
                s.Discount,
                
                s.DiscountType,
                s.EndDate,
                s.Code,
                s.Id,
                s.StartDate,
                s.MinimumPurchase,
            })
            .ToListAsync();
        return ApiResponseFactory.Ok(coupons, HttpContext);
    }

    // Admin: POST /api/v1/admin/coupons
    [HttpPost()]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> Create([FromBody] CreateCouponRequest request)
    {
        var coupon = new Coupon
        {
            Code = request.Code,
            Discount = request.Discount,
            DiscountType = request.DiscountType,
            MinimumPurchase = request.MinimumPurchase,
            MaxDiscount = request.MaxDiscount,
        UsageLimit = request.UsageLimit,
            UsedCount = 0,
            Status = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        if (request.StartDate.HasValue)
        {
            coupon.StartDate = DateTime.SpecifyKind(
                request.StartDate.Value,
                DateTimeKind.Utc);
        }

        if (request.EndDate.HasValue)
        {
            coupon.EndDate = DateTime.SpecifyKind(
                request.EndDate.Value,
                DateTimeKind.Utc);
        }
        _dbContext.Coupons.Add(coupon);
        await _dbContext.SaveChangesAsync();
     return   ApiResponseFactory.Created(coupon, HttpContext);
    }

    // Admin: PUT /api/v1/admin/coupon/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateCouponRequest request)
    {
        var coupon = await _dbContext.Coupons.FindAsync(id);
        if (coupon == null)
            return NotFound();

        coupon.Status = request.Status;
        if (request.StartDate.HasValue)
        {
            coupon.StartDate = DateTime.SpecifyKind(
                request.StartDate.Value,
                DateTimeKind.Utc);
        }
          
        if (request.EndDate.HasValue)
        {
            coupon.EndDate = DateTime.SpecifyKind(
                request.EndDate.Value,
                DateTimeKind.Utc);
        }
        coupon.Code = request.Code;
        coupon.MaxDiscount = request.MaxDiscount;
        coupon.MinimumPurchase = request.MinimumPurchase;
        coupon.DiscountType = request.DiscountType;
        coupon.Discount = request.Discount;
        coupon.UpdatedAt = DateTime.UtcNow;
        _dbContext.Entry(coupon).State = EntityState.Modified;
        await _dbContext.SaveChangesAsync();
        return ApiResponseFactory.Accepted(coupon, HttpContext);
    }

    // Admin: DELETE /api/v1/admin//{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> Delete(long id)
    {
        var coupon = await _dbContext.Coupons.FindAsync(id);
        if (coupon == null)
            return NotFound();

        _dbContext.Coupons.Remove(coupon);
        await _dbContext.SaveChangesAsync();

        return ApiResponseFactory.Accepted(coupon, HttpContext);
    }

   
    public record CreateCouponRequest
    {
        public string Code { get; set; } = string.Empty;
        public double Discount { get; set; }
        public string? DiscountType { get; set; }
        public double? MinimumPurchase { get; set; } = 0;
        public double? MaxDiscount { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? UsageLimit { get; set; } = 0;
        public int UsedCount { get; set; } = 0;
        public bool Status { get; set; }
    };
    public record UpdateCouponRequest
    {
        public string Code { get; set; } = string.Empty;
        public double Discount { get; set; }
        public string? DiscountType { get; set; }
        public double? MinimumPurchase { get; set; } = 0;
        public double? MaxDiscount { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? UsageLimit { get; set; } = 0;
        public int UsedCount { get; set; } = 0;
        public bool Status { get; set; }
    }
}
