using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OneWeb.Domain.Auth;
using OneWeb.Domain.Entities;
using OneWeb.Domain.Interfaces;
using OneWeb.Infrastructure.Persistence;
using OneWeb.Infrastructure.Services;

namespace OneWeb.Application.Features.Auth.Commands;

public class VerifyOtpCommandHandler : IRequestHandler<VerifyOtpCommand, AuthResult>
{
    private readonly IOtpService _otpService;
    private readonly AppDbContext _dbContext;
    private readonly ITokenService _tokenService;
    private readonly RefreshTokenService _refreshTokenService;
    private readonly MasterAuthOptions _master;

    public VerifyOtpCommandHandler(
        IOtpService otpService,
        AppDbContext dbContext,
        ITokenService tokenService,
        RefreshTokenService refreshTokenService,
        IOptions<MasterAuthOptions> master)
    {
        _otpService = otpService;
        _dbContext = dbContext;
        _tokenService = tokenService;
        _refreshTokenService = refreshTokenService;
        _master = master.Value;
    }
    
    public async Task<AuthResult> Handle(VerifyOtpCommand request, CancellationToken cancellationToken)
    {
        // Validate OTP
        var isValid = await _otpService.ValidateOtpAsync(request.Phone, request.Otp);
        if (!isValid)
            return new AuthResult(false, null, null, null, null, "Invalid or expired OTP");
        
        // Find user by phone
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Phone == request.Phone, cancellationToken);
      
        // If not found, create new user
        if (user == null)
        {
            user = new User
            {
                Phone = request.Phone,
                // The bootstrap master number comes pre-named so it can skip
                // the "what's your name?" step on first login.
                Name = _master.IsMasterPhone(request.Phone) ? _master.Name : null,
                UserType = "customer",
                Status = true,
                IsApproved = true,
                CountryCode = "+880",
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        bool requiredName = string.IsNullOrEmpty( user.Name);
        // Generate tokens
        var accessToken = _tokenService.GenerateAccessToken(user.Id, user.UserType ?? "customer", user.Phone);
        var refreshToken = _tokenService.GenerateRefreshToken();
        
        // Save refresh token
        await _refreshTokenService.SaveRefreshTokenAsync(user.Id, refreshToken);
        
        return new AuthResult(true, accessToken, refreshToken, user.UserType, user.Id, "Login successful", requiredName, user.Name, user.Phone);
    }
}
