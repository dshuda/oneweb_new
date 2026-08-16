using System;

namespace OneWeb.Domain.Entities;

public class CommissionHistory : BaseEntity
{
    public long VendorId { get; set; }
    public long OrderId { get; set; }
    public double CommissionAmount { get; set; }
    public double VendorAmount { get; set; }
    public double AdminAmount { get; set; }
}
