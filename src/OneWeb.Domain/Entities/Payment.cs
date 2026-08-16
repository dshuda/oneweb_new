using System;

namespace OneWeb.Domain.Entities;

public class Payment : BaseEntity
{
    public long? UserId { get; set; }
    public long? OrderId { get; set; }
    public double? Amount { get; set; }
    public string? TransactionId { get; set; }
    public string? PaymentMethod { get; set; } // cod, bkash, nagad, rocket
    public string? Status { get; set; } // pending, completed, failed

    // Navigation property
    public Order? Order { get; set; }
}
