using MediatR;

namespace OneWeb.Application.Features.Services.Commands;

public record DeleteServiceCommand(long Id) : IRequest<bool>;
