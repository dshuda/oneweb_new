using System;

namespace OneWeb.Domain.Entities;

public class ServicePrice : BaseEntity
{
    public long ServiceId { get; set; }
    public string? Name { get; set; }
    public double Price { get; set; } = 0;
    public bool Status { get; set; } = true;

    // Navigation property
    public Service Service { get; set; } = null!;
}
