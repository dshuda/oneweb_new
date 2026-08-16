using System;

namespace OneWeb.Domain.Entities;

public class Rating : BaseEntity
{
    public long? UserId { get; set; }
    public long? VendorId { get; set; }
    public long? OrderId { get; set; }
    public double? RatingValue { get; set; } = 0;
    public string? Review { get; set; }
    public bool Status { get; set; } = true;
}
