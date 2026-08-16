using System;

namespace OneWeb.Domain.Entities;

public class SupportTicket : BaseEntity
{
    public long? UserId { get; set; }
    public string? Subject { get; set; }
    public string? Message { get; set; }
    public string? Status { get; set; } = "open"; // open, replied, closed

    // Navigation property
    public User? User { get; set; }
}
