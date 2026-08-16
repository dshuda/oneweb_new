using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OneWeb.Domain.Interfaces;

namespace OneWeb.Infrastructure.Services;

public class SmsService : ISmsService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<SmsService> _logger;
    
    public SmsService(HttpClient httpClient, IConfiguration config, ILogger<SmsService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
    }
    
    public async Task<bool> SendOtpAsync(string phoneNumber, string otp)
    {
        try
        {
            var apiToken = _config["Sms:ApiKey"];
            var senderId = _config["Sms:SenderId"];
            var csmsId = Guid.NewGuid().ToString();
            
            var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("api_token", apiToken!),
                new KeyValuePair<string, string>("sid", senderId!),
                new KeyValuePair<string, string>("msisdn", phoneNumber),
                new KeyValuePair<string, string>("sms", $"Your OTP: {otp}"),
                new KeyValuePair<string, string>("csmsid", csmsId)
            });
            
            var response = await _httpClient.PostAsync("https://sms.sslwireless.com/pushapi/dynamic/server.php", content);
            
            if (response.IsSuccessStatusCode)
                return true;
            
            _logger.LogError($"SMS sending failed: {response.StatusCode}");
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending SMS");
            return false;
        }
    }
}
