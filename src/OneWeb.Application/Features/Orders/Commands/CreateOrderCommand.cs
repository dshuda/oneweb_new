using MediatR;
using OneWeb.Application.Common.Models;

namespace OneWeb.Application.Features.Orders.Commands;

public record CreateOrderCommand : IRequest<CreateOrderResult>{
  public   long UserId;
  public   int PriceId;
  public   int ServiceId;
    public DateOnly ServiceDate;
    public TimeSpan Time;
  public   string? ShippingAddress;
  public   string? AdditionalInfo;
  public   string? PaymentType;
  public   string? CouponCode;
  public   string? Latitude;
  public   string? Longitude;
  public   string OrderFrom = "web";
}

public record CreateOrderResult(bool Success, long? OrderId, string? TrackingCode, string? Message);
