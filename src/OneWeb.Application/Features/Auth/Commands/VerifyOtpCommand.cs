using MediatR;
using OneWeb.Domain.Entities;

namespace OneWeb.Application.Features.Auth.Commands;

public record VerifyOtpCommand(string Phone, string Otp) : IRequest<AuthResult>;
public record AuthResult(
    bool Success, 
    string? AccessToken, 
    string? RefreshToken, 
    string? UserType, 
    long? UserId, 
    string? Message, 
    bool NameRequired = false,
    string? Name = null,
    string? Address = null,
    string? Email = null,
    string? Phone = null
);
