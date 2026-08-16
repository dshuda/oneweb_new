namespace OneWeb.Application.Features.Orders.DTOs;

public record OrderDto(
    long Id, 
    string? TrackingCode, 
    string DeliveryStatus,
    string PaymentStatus, 
    string? PaymentType,
    double? GrandTotal, 
    double CouponDiscount,
    string? ShippingAddress, 
    string? AdditionalInfo,
    DateTime? CreatedAt,
    string? Customer,
    ServiceSummaryDto? Service,
    string? OrderFrom
);
public record CustomerOrderDto
{
    public long Id { get; set; }
    public string? TrackingCode { get; set; }
    public string DeliveryStatus { get; set; }
    public string PaymentStatus { get; set; }
    public string? PaymentType { get; set; }
    public double? GrandTotal { get; set; }
    public double CouponDiscount { get; set; }
    public string? ShippingAddress { get; set; }
    public string? AdditionalInfo { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string? Customer { get; set; }
    public string? Vendor { get; set; }
    public string? VendorContact { get; set; }
    public ServiceSummaryDto? Service { get; set; }
    public string? OrderFrom { get; set; }
}
public record OrderAdminDto
{
    public long Id { get; set; }
    public string? TrackingCode { get; set; }
    public string DeliveryStatus { get; set; }
    public string PaymentStatus { get; set; }
    public string? PaymentType { get; set; }
    public double? GrandTotal { get; set; }
    public double CouponDiscount { get; set; }
    public string? ShippingAddress { get; set; }
    public string? AdditionalInfo { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string? Customer { get; set; }
    public string? Vendor { get; set; }
    public string? VendorContact { get; set; }
    public long? VendorId { get; set; }
    public long? PriceId { get; set; }
    public ServiceSummaryDto? Service { get; set; }
    public List<PricingDto>? Pricing { get; set; }
    public string? OrderFrom { get; set; }
}

public record  PricingDto
{
    public long Id { get; set; }
    public string Name { get; set; }
    public double  Price { get; set; }
    public bool  Selected { get; set; }
}
public record ServiceSummaryAdminDto(long Id, string Name, string? Slug);
public record ServiceSummaryDto(long Id, string Name, string? Slug);

public record OrderDetailResponse(
    OrderDto Order,
    List<StatusHistoryItem> StatusHistory
);

public record StatusHistoryItem(string Status, DateTime Timestamp);
