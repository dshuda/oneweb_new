using System;

namespace OneWeb.Domain.Entities;

/// <summary>
/// T2.3 — Tracks coupon usage per user to prevent multiple redemptions of the same coupon by the same person.
/// </summary>
public class CouponUsage : BaseEntity
{
    public long CouponId { get; set; }
    public long UserId { get; set; }
    public long? OrderId { get; set; }

    // Navigation properties
    public virtual Coupon Coupon { get; set; } = null!;
    public virtual User User { get; set; } = null!;
    public virtual Order? Order { get; set; }
}
