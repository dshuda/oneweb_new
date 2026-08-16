namespace OneWeb.Domain.Interfaces;

public interface IOtpService
{
    Task<string> GenerateAndSaveOtpAsync(string phone);
    Task<bool> ValidateOtpAsync(string phone, string otp);
}
