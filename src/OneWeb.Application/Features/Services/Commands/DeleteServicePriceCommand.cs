using MediatR;

namespace OneWeb.Application.Features.Services.Commands;

public record DeleteServicePriceCommand(long Id) : IRequest<bool>;
