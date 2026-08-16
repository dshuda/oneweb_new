using MediatR;
using Microsoft.EntityFrameworkCore;
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
    
    public VerifyOtpCommandHandler(
        IOtpService otpService,
        AppDbContext dbContext,
        ITokenService tokenService,
        RefreshTokenService refreshTokenService)
    {
        _otpService = otpService;
        _dbContext = dbContext;
        _tokenService = tokenService;
        _refreshTokenService = refreshTokenService;
    }
    
    public async Task<AuthResult> Handle(VerifyOtpCommand request, CancellationToken cancellationToken)
    {
        // Validate OTP
        var isValid = await _otpService.ValidateOtpAsync(request.Phone, request.Otp);
        if (!isValid)
            return new AuthResult(false, null, null, null, null, "Invalid or expired OTP");
        
        // Clean and normalize phone number
        var rawPhone = request.Phone?.Trim() ?? "";
        var digits = new string(rawPhone.Where(char.IsDigit).ToArray());
        var cleanPhone = digits;
        if (digits.StartsWith("880") && digits.Length >= 13)
        {
            cleanPhone = "0" + digits.Substring(3);
        }
        else if (digits.Length == 10 && !digits.StartsWith("0"))
        {
            cleanPhone = "0" + digits;
        }

        var with88 = "+88" + cleanPhone;
        var with88NoPlus = "88" + cleanPhone;
        var last10 = cleanPhone.Length >= 10 ? cleanPhone.Substring(cleanPhone.Length - 10) : cleanPhone;

        // Find user by phone (flexible matching)
        var user = await _dbContext.Users.FirstOrDefaultAsync(
            u => u.Phone == request.Phone ||
                 u.Phone == cleanPhone ||
                 u.Phone == with88 ||
                 u.Phone == with88NoPlus ||
                 (u.Phone != null && u.Phone.EndsWith(last10)),
            cancellationToken);
      
        // If not found, create new user
        if (user == null)
        {
            user = new User
            {
                Phone = cleanPhone,
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
        
        return new AuthResult(
            true, 
            accessToken, 
            refreshToken, 
            user.UserType, 
            user.Id, 
            "Login successful", 
            requiredName,
            user.Name,
            user.Address,
            user.Email,
            user.Phone
        );
    }
}
