using MediatR;
using OneWeb.Application.Common.Models;

namespace OneWeb.Application.Features.Orders.Commands;

public record CreateOrderCommand : IRequest<CreateOrderResult>
{
    public long UserId { get; set; }
    public long PriceId { get; set; }
    public long ServiceId { get; set; }
    public DateOnly ServiceDate { get; set; }
    public TimeSpan? Time { get; set; }
    public string? ShippingAddress { get; set; }
    public string? AdditionalInfo { get; set; }
    public string? PaymentType { get; set; }
    public string? CouponCode { get; set; }
    public string? Latitude { get; set; }
    public string? Longitude { get; set; }
    public string OrderFrom { get; set; } = "web";
}

public record CreateOrderResult(bool Success, long? OrderId, string? TrackingCode, string? Message);
