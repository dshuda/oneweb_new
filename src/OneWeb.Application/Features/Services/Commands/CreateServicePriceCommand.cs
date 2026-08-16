using MediatR;

namespace OneWeb.Application.Features.Services.Commands;

public record CreateServicePriceCommand : IRequest<long>
{
public long ServiceId {get;set;}
public double Price {get;set;}
public string Name { get; set; }
}
