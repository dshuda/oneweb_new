using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Domain.Interfaces;
using OneWeb.Infrastructure.Persistence;
using OneWeb.Infrastructure.Services;

namespace OneWeb.Application.Features.Auth.Commands;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResult>
{
    private readonly RefreshTokenService _refreshTokenService;
    private readonly ITokenService _tokenService;
    private readonly AppDbContext _dbContext;
    
    public RefreshTokenCommandHandler(
        RefreshTokenService refreshTokenService,
        ITokenService tokenService,
        AppDbContext dbContext)
    {
        _refreshTokenService = refreshTokenService;
        _tokenService = tokenService;
        _dbContext = dbContext;
    }
    
    public async Task<AuthResult> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        // Validate refresh token
        var isValid = await _refreshTokenService.ValidateAndRevokeAsync(request.UserId, request.RefreshToken);
        if (!isValid)
            return new AuthResult(false, null, null, null, null, "Invalid refresh token");
        
        // Find user by Id
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user == null)
            return new AuthResult(false, null, null, null, null, "User not found");
        
        // Generate new tokens
        var newAccessToken = _tokenService.GenerateAccessToken(
            user.Id, user.UserType ?? "customer", user.Phone);
        var newRefreshToken = _tokenService.GenerateRefreshToken();
        
        // Save new refresh token
        await _refreshTokenService.SaveRefreshTokenAsync(user.Id, newRefreshToken);
        
        return new AuthResult(true, newAccessToken, newRefreshToken, user.UserType, user.Id, "Token refreshed");
    }
}
