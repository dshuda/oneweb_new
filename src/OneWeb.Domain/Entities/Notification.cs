using System;

namespace OneWeb.Domain.Entities;

public class Notification : BaseEntity
{
    public long? UserId { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Image { get; set; }
    public string? Type { get; set; }
    public bool IsRead { get; set; } = false;
}
