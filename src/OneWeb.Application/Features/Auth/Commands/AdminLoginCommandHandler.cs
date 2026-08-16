using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Domain.Interfaces;
using OneWeb.Infrastructure.Persistence;
using OneWeb.Infrastructure.Services;

namespace OneWeb.Application.Features.Auth.Commands;

public class AdminLoginCommandHandler : IRequestHandler<AdminLoginCommand, AuthResult>
{
    private readonly AppDbContext _dbContext;
    private readonly ITokenService _tokenService;
    private readonly RefreshTokenService _refreshTokenService;
    
    public AdminLoginCommandHandler(
        AppDbContext dbContext,
        ITokenService tokenService,
        RefreshTokenService refreshTokenService)
    {
        _dbContext = dbContext;
        _tokenService = tokenService;
        _refreshTokenService = refreshTokenService;
    }
    
    public async Task<AuthResult> Handle(AdminLoginCommand request, CancellationToken cancellationToken)
    {
        // Find user by email where UserType is "admin" or "staff"
        var user = await _dbContext.Users.FirstOrDefaultAsync(
            u => u.Email.ToLower() == request.Email.ToLower() && 
                (u.UserType == "admin" || u.UserType == "staff"),
            cancellationToken);
        
        if (user == null)
            return new AuthResult(false, null, null, null, null, "User not found or not an admin");

        if (string.IsNullOrEmpty(user.Password))
            return new AuthResult(false, null, null, null, null, "Invalid credentials");
        
        // Verify password
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            return new AuthResult(false, null, null, null, null, "Invalid credentials");
        
        // Generate tokens
        var accessToken = _tokenService.GenerateAccessToken(
            user.Id, user.UserType ?? "admin", user.Phone);
        var refreshToken = _tokenService.GenerateRefreshToken();
        
        // Save refresh token
        await _refreshTokenService.SaveRefreshTokenAsync(user.Id, refreshToken);
        
        return new AuthResult(true, accessToken, refreshToken, user.UserType, user.Id, "Login successful");
    }
}
