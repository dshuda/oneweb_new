using System;

namespace OneWeb.Domain.Entities;

public class ServiceSchedule : BaseEntity
{
    public long ServiceId { get; set; }
    public string? Day { get; set; } // e.g. "Monday"
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public bool Status { get; set; } = true;

    // Navigation property
    public Service Service { get; set; } = null!;
}
