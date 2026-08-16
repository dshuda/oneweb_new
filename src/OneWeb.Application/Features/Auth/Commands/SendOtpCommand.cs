using MediatR;
using OneWeb.Domain.Entities;

namespace OneWeb.Application.Features.Auth.Commands;

public record SendOtpCommand(string Phone) : IRequest<SendOtpResult>;
public record SendOtpResult(bool Success, string Message);
