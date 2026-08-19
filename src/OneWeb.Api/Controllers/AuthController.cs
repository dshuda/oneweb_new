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
    
    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }
    
    // DTOs as nested records
    public record SendOtpRequest(string Phone);
    public record VerifyOtpRequest(string Phone, string Otp);
    public record AdminLoginRequest(string Email, string Password);
    public record RefreshTokenRequest(long UserId, string RefreshToken);
    
    [HttpPost("send-otp")]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
    {
        var result = await _mediator.Send(new SendOtpCommand(request.Phone, GetClientIp()));

        // 429 with Retry-After when the caller is being rate limited, so clients
        // can back off properly instead of hammering.
        if (!result.Success && result.RetryAfterSeconds > 0)
        {
            Response.Headers.RetryAfter = result.RetryAfterSeconds.ToString();
            return StatusCode(StatusCodes.Status429TooManyRequests,
                new { success = false, message = result.Message, retryAfter = result.RetryAfterSeconds });
        }

        return Ok(new { success = result.Success, message = result.Message });
    }

    /// <summary>Real client address, honouring X-Forwarded-For when behind nginx/Cloudflare.</summary>
    private string? GetClientIp()
    {
        var forwarded = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwarded))
            return forwarded.Split(',')[0].Trim();

        return HttpContext.Connection.RemoteIpAddress?.ToString();
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
            NameRequired = result.NameRequired,
            name = result.Name,
            phone = result.Phone
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
