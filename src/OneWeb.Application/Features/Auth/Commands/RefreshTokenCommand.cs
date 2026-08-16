using MediatR;
using OneWeb.Domain.Entities;

namespace OneWeb.Application.Features.Auth.Commands;

public record RefreshTokenCommand(long UserId, string RefreshToken) : IRequest<AuthResult>;
