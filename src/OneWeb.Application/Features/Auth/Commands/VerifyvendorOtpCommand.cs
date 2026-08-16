using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Interfaces;
using OneWeb.Infrastructure.Persistence;
using OneWeb.Infrastructure.Services;

namespace OneWeb.Application.Features.Auth.Commands;

public class VerifyVendorOtpCommand : IRequest<AuthResult>
{
    public string Phone { get; set; }
    public string Otp { get; set; }
}
internal class VerifyVendorOtpCommandHandler : IRequestHandler<VerifyVendorOtpCommand, AuthResult>
{
    private readonly IOtpService _otpService;
    private readonly AppDbContext _dbContext;
    private readonly ITokenService _tokenService;
    private readonly RefreshTokenService _refreshTokenService;
    
    public VerifyVendorOtpCommandHandler(
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
    
    public async Task<AuthResult> Handle(VerifyVendorOtpCommand request, CancellationToken cancellationToken)
    {
        // Validate OTP
        var isValid = await _otpService.ValidateOtpAsync(request.Phone, request.Otp);
        if (!isValid)
            return new AuthResult(false, null, null, null, null, "Invalid or expired OTP");
        
        // Find user by phone
        var user = await _dbContext.Vendors.Include(f=>f.User).FirstOrDefaultAsync(u => u.User.Phone == request.Phone, cancellationToken);

        if(user == null)
        {
            return new AuthResult(false, null, null, null, null, "Vendor Not Found");
        }
        
        //bool requiredName = string.IsNullOrEmpty( user.User.Name);
        // Generate tokens
        var accessToken = _tokenService.GenerateAccessToken(user.Id, user.User.UserType ?? "vendor", user.User.Phone);
        var refreshToken = _tokenService.GenerateRefreshToken();
        
        // Save refresh token
        await _refreshTokenService.SaveRefreshTokenAsync(user.Id, refreshToken);
        
        return new AuthResult(true, accessToken, refreshToken, user.User.UserType, user.Id, "Login successful");
    }
}
