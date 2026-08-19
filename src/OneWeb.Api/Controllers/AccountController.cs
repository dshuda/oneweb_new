using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api.Controllers;

/// <summary>
/// Self-service account endpoints ported from the Laravel UserController:
/// profile, password change, avatar and account deletion. Account deletion is
/// not optional — both app stores require an in-product way to delete an
/// account, and there was no such endpoint.
/// </summary>
[ApiController]
[Route("api/v1/account")]
public class AccountController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public AccountController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private long GetUserId() =>
        long.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var id = GetUserId();
        var user = await _dbContext.Users
            .Where(u => u.Id == id)
            .Select(u => new
            {
                u.Id, u.Name, u.Email, u.Phone, u.Gender, u.Dob,
                u.ImageId, u.Address, u.Latitude, u.Longitude, u.UserType, u.CreatedAt,
            })
            .FirstOrDefaultAsync();

        return user == null ? NotFound() : Ok(user);
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == GetUserId());
        if (user == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Name)) user.Name = request.Name.Trim();
        if (request.Email != null) user.Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();
        if (request.Gender != null) user.Gender = request.Gender;
        if (request.Dob != null) user.Dob = request.Dob;
        if (request.Address != null) user.Address = request.Address;
        if (request.Latitude != null) user.Latitude = request.Latitude;
        if (request.Longitude != null) user.Longitude = request.Longitude;
        user.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return Ok(new { message = "Profile updated" });
    }

    /// <summary>Store the avatar URL produced by the CDN upload endpoint.</summary>
    [HttpPut("profile-image")]
    [Authorize]
    public async Task<IActionResult> UpdateProfileImage([FromBody] ProfileImageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ImageUrl))
            return BadRequest(new { message = "An image URL is required" });

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == GetUserId());
        if (user == null) return NotFound();

        user.ImageId = request.ImageUrl;
        user.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return Ok(new { message = "Profile image updated", imageUrl = user.ImageId });
    }

    /// <summary>
    /// Change the password. Only meaningful for accounts that have one (staff
    /// and admins) — customers authenticate by OTP and have no password to change.
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 8)
            return BadRequest(new { message = "The new password must be at least 8 characters" });

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == GetUserId());
        if (user == null) return NotFound();

        if (string.IsNullOrEmpty(user.Password))
            return BadRequest(new { message = "This account signs in with a one-time code, not a password" });

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword ?? string.Empty, user.Password))
            return BadRequest(new { message = "The current password is incorrect" });

        user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return Ok(new { message = "Password changed" });
    }

    /// <summary>
    /// Delete the signed-in account. Soft delete: DeletedAt is set, which the
    /// global query filter honours, so the user disappears everywhere while
    /// their past orders stay intact for accounting.
    /// </summary>
    [HttpDelete]
    [Authorize]
    public async Task<IActionResult> DeleteAccount()
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == GetUserId());
        if (user == null) return NotFound();

        if (user.UserType == "admin")
            return BadRequest(new { message = "Admin accounts cannot be self-deleted" });

        user.DeletedAt = DateTime.UtcNow;
        user.Status = false;
        user.UpdatedAt = DateTime.UtcNow;

        // Stop future pushes to a deleted account's devices.
        var tokens = await _dbContext.FcmTokens.Where(t => t.UserId == user.Id).ToListAsync();
        _dbContext.FcmTokens.RemoveRange(tokens);

        await _dbContext.SaveChangesAsync();
        return Ok(new { message = "Account deleted" });
    }

    /// <summary>
    /// Minimum/current app versions, read from business settings. The mobile
    /// apps call this on launch to decide whether to force an update.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("/api/v1/app-version")]
    public async Task<IActionResult> AppVersion([FromQuery] string platform = "android")
    {
        var wanted = platform.Equals("ios", StringComparison.OrdinalIgnoreCase) ? "ios" : "android";

        var settings = await _dbContext.BusinessSettings
            .Where(s => s.Type == $"current_version_{wanted}" || s.Type == $"minimum_version_required_{wanted}")
            .ToDictionaryAsync(s => s.Type, s => s.Value);

        var current = settings.GetValueOrDefault($"current_version_{wanted}") ?? "1.0.0";
        var minimum = settings.GetValueOrDefault($"minimum_version_required_{wanted}") ?? "1.0.0";

        return Ok(new { platform = wanted, currentVersion = current, minimumVersion = minimum });
    }

    public record UpdateProfileRequest(
        string? Name, string? Email, string? Gender, string? Dob,
        string? Address, string? Latitude, string? Longitude);

    public record ProfileImageRequest(string ImageUrl);

    public record ChangePasswordRequest(string? CurrentPassword, string NewPassword);
}
