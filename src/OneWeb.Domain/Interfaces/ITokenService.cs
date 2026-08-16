namespace OneWeb.Domain.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(long userId, string userType, string? phone);
    string GenerateRefreshToken();
    long? ValidateRefreshToken(string token);
}
