using System;

namespace OneWeb.Domain.Entities;

/// <summary>
/// T3.1 — Junction table for Vendor and Service entities.
/// Replaces the legacy comma-separated string "service_id" in the vendors table.
/// </summary>
public class VendorService : BaseEntity
{
    public long VendorId { get; set; }
    public long ServiceId { get; set; }

    // Navigation properties
    public virtual Vendor Vendor { get; set; } = null!;
    public virtual Service Service { get; set; } = null!;
}
