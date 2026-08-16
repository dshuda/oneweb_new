using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using OneWeb.Api.DTOs;
using OneWeb.Application.Features.Auth.Commands;
using OneWeb.Application.Features.Auth.Vendor;

namespace OneWeb.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly OneWeb.Infrastructure.Persistence.AppDbContext _dbContext;
    
    public AuthController(IMediator mediator, OneWeb.Infrastructure.Persistence.AppDbContext dbContext)
    {
        _mediator = mediator;
        _dbContext = dbContext;
    }
    
    // DTOs as nested records
    public record SendOtpRequest(string Phone);
    public record VerifyOtpRequest(string Phone, string Otp);
    public record AdminLoginRequest(string Email, string Password);
    public record RefreshTokenRequest(long UserId, string RefreshToken);
    public record UpdateProfileRequest(string? Name, string? Address, string? Email);
    
    [HttpPost("send-otp")]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
    {
        var result = await _mediator.Send(new SendOtpCommand(request.Phone));
        return Ok(new { success = result.Success, message = result.Message });
    }
    
    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        var result = await _mediator.Send(new VerifyOtpCommand(request.Phone, request.Otp));
        
        if (!result.Success)
            return Unauthorized(new { message = result.Message });
        
        return Ok(new 
        { 
            success = true,
            accessToken = result.AccessToken, 
            refreshToken = result.RefreshToken, 
            userType = result.UserType,
            userId = result.UserId,
            name = result.Name,
            address = result.Address,
            email = result.Email,
            phone = result.Phone,
            NameRequired = result.NameRequired
        });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !long.TryParse(userIdClaim.Value, out var userId))
            return Unauthorized(new { message = "Invalid user token" });

        var user = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
            _dbContext.Users, u => u.Id == userId
        );
        if (user == null)
            return NotFound(new { message = "User not found" });

        return Ok(new
        {
            id = user.Id,
            name = user.Name,
            phone = user.Phone,
            email = user.Email,
            address = user.Address,
            userType = user.UserType
        });
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !long.TryParse(userIdClaim.Value, out var userId))
            return Unauthorized(new { message = "Invalid user token" });

        var user = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
            _dbContext.Users, u => u.Id == userId
        );
        if (user == null)
            return NotFound(new { message = "User not found" });

        if (request.Name != null) user.Name = request.Name.Trim();
        if (request.Address != null) user.Address = request.Address.Trim();
        if (request.Email != null) user.Email = request.Email.Trim();

        _dbContext.Entry(user).State = Microsoft.EntityFrameworkCore.EntityState.Modified;
        await _dbContext.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Profile updated successfully",
            id = user.Id,
            name = user.Name,
            phone = user.Phone,
            email = user.Email,
            address = user.Address
        });
    }
    
    [HttpPost("admin/login")]
    public async Task<IActionResult> AdminLogin([FromBody] AdminLoginRequest request)
    {
        var result = await _mediator.Send(new AdminLoginCommand(request.Email, request.Password));
        
        if (!result.Success)
            return Unauthorized(new { success = false, message = result.Message });
        
        return Ok(new 
        { 
            success = true,
            accessToken = result.AccessToken, 
            refreshToken = result.RefreshToken, 
            userType = result.UserType,
            userId = result.UserId
        });
    }
    
    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var result = await _mediator.Send(new RefreshTokenCommand(request.UserId, request.RefreshToken));
        
        if (!result.Success)
            return Unauthorized(new { message = result.Message });
        
        return Ok(new 
        { 
            accessToken = result.AccessToken, 
            refreshToken = result.RefreshToken, 
            userType = result.UserType 
        });
    }

    [HttpPost("vendor/login")]
    public async Task<IActionResult> VendorLogin([FromBody] SendOTPforVendorCommand command)
    {
       var result =  await _mediator.Send(command);
        return Ok(new { success = result.Success, message = result.Message });
    }
    [HttpPost("vendor/verify-otp")]
    public async Task<IActionResult> VendorVefiyOtp([FromBody] VerifyVendorOtpCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.Success)
            return Unauthorized(new { message = result.Message });

        return Ok(new
        {
            success = true,
            accessToken = result.AccessToken,
            refreshToken = result.RefreshToken,
            userType = result.UserType,
            userId = result.UserId,
            NameRequired = false
        });
    }




    [HttpPost("update-name")]
    [Authorize(Roles = "customer")]
    public async Task<IActionResult> UpdateName([FromBody] UpdateNameCommand command)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return BadRequest(new { message = "Invalid token" });

        var userId = long.Parse(userIdClaim.Value);
        command.UserId = userId;
        await _mediator.Send(command);
        return ApiResponseFactory.Ok(command, HttpContext);
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return BadRequest(new { message = "Invalid token" });
        
        var userId = long.Parse(userIdClaim.Value);
        
        // Revoke all user tokens
        var refreshTokenService = HttpContext.RequestServices.GetRequiredService<OneWeb.Infrastructure.Services.RefreshTokenService>();
        await refreshTokenService.RevokeAllUserTokensAsync(userId);
        
        return Ok(new { message = "Logged out" });
    }
}
