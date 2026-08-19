using MediatR;
using OneWeb.Domain.Entities;

namespace OneWeb.Application.Features.Auth.Commands;

/// <param name="IpAddress">Caller's address, used for rate limiting. Optional.</param>
public record SendOtpCommand(string Phone, string? IpAddress = null) : IRequest<SendOtpResult>;

/// <param name="RetryAfterSeconds">Set when the caller was rate limited.</param>
public record SendOtpResult(bool Success, string Message, int RetryAfterSeconds = 0);
