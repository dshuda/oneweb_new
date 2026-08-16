using System;

namespace OneWeb.Domain.Entities;

public class OrderDetail : BaseEntity
{
    public long OrderId { get; set; }
    public long? ServiceId { get; set; }
    public double? Price { get; set; }
    public double? Tax { get; set; }
    public double? DeliveryCharge { get; set; } = 0;
    public string? CouponCode { get; set; }
    public double? CouponDiscount { get; set; } = 0;

    // Navigation property
    public Order Order { get; set; } = null!;
}
