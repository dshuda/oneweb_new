using System;

namespace OneWeb.Domain.Entities;

public class VendorWithdrawRequest : BaseEntity
{
    public long VendorId { get; set; }
    public double Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? AccountNumber { get; set; }
    public string? Status { get; set; } = "pending";
    public string? Note { get; set; }

    // Navigation property
    public Vendor Vendor { get; set; } = null!;
}
