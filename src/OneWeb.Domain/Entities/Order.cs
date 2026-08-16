using System;
using System.Collections.Generic;

namespace OneWeb.Domain.Entities;

public class Order : BaseEntity
{
    public long UserId { get; set; }
    public long? VendorId { get; set; }
    public long ServiceId { get; set; }
    public long PriceId { get; set; }
    public long? AssignResourceId { get; set; }
    public string? ShippingAddress { get; set; }
    public string? AdditionalInfo { get; set; }
    public string? ShippingType { get; set; }
    public string OrderFrom { get; set; } = "app";
    public string DeliveryStatus { get; set; } = "pending";
    // values: pending, confirmed, assigned, on_the_way, in_progress, completed, cancelled
    public string? DeliverStatusJson { get; set; } // JSON history
    public string? PaymentType { get; set; } // cod, bkash, nagad, rocket
    public string PaymentStatus { get; set; } = "unpaid"; // unpaid, paid
    public string? PaymentDetails { get; set; }
    public double? GrandTotal { get; set; }
    public double CouponDiscount { get; set; } = 0;
    public string? Code { get; set; }
    public string? TrackingCode { get; set; }
    public long? Date { get; set; } // unix timestamp
    public int Viewed { get; set; } = 0;
    public int DeliveryViewed { get; set; } = 1;
    public int PaymentStatusViewed { get; set; } = 1;
    public int CommissionCalculated { get; set; } = 0;
    public int IsCancelled { get; set; } = 0;
    public long? BeforePic { get; set; }
    public long? AfterPic { get; set; }
    public string? Latitude { get; set; }
    public string? Longitude { get; set; }

    // Preparence
    public DateOnly ServiceDate { get; set; }
    public TimeSpan? Time { get; set; }



    // Navigation properties
    public User? User { get; set; }
    public Service? Service { get; set; }
    public OrderDetail? Detail { get; set; }
    public Payment? Payment { get; set; }
    public Rating? Rating { get; set; }
}
