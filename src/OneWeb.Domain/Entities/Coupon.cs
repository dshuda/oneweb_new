using System;

namespace OneWeb.Domain.Entities;

public class Coupon : BaseEntity
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
    public bool Status { get; set; } = true;
}
