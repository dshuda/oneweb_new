using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OneWeb.Domain.Bulk;
using System.Text.Json;

namespace OneWeb.Infrastructure.Bulk
{
    public class BulkSMSServices : IBulkSMServices
    {
        private readonly BulkSMS _smsConfig;
        private readonly ILogger<BulkSMSServices>? _logger;
        private const string SingleSmsUrl = "http://bulksmsbd.net/api/smsapi";
        private const string ManySmsUrl = "http://bulksmsbd.net/api/smsapimany";

        public BulkSMSServices(IOptions<BulkSMS> smsOptions, ILogger<BulkSMSServices>? logger = null)
        {
            _smsConfig = smsOptions.Value;
            _logger = logger;
        }

        public async Task<BulkSMSApiResponse> SendAsync(string mobile, string message)
        {
            try
            {
                var cleanNumber = mobile.Trim();
                if (!cleanNumber.StartsWith("88") && cleanNumber.StartsWith("01"))
                {
                    cleanNumber = "88" + cleanNumber;
                }

                using var client = new HttpClient();
                var encodedMessage = Uri.EscapeDataString(message);
                var url = $"{SingleSmsUrl}?api_key={Uri.EscapeDataString(_smsConfig.Api_Key)}&type=text&number={Uri.EscapeDataString(cleanNumber)}&senderid={Uri.EscapeDataString(_smsConfig.SenderId)}&message={encodedMessage}";

                var response = await client.GetAsync(url);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger?.LogInformation("BulkSMS response for {Number}: {Response}", cleanNumber, responseContent);

                if (!string.IsNullOrEmpty(responseContent))
                {
                    var result = JsonSerializer.Deserialize<BulkSMSApiResponse>(responseContent);
                    return result ?? new BulkSMSApiResponse();
                }

                return new BulkSMSApiResponse { response_code = (int)response.StatusCode };
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Failed to send SMS to {Mobile}", mobile);
                return new BulkSMSApiResponse { response_code = 500, error_message = ex.Message };
            }
        }

        public async Task<BulkSMSApiResponse> SendAsync(List<SMS> sms)
        {
            try
            {
                using var client = new HttpClient();
                var data = new
                {
                    api_key = _smsConfig.Api_Key,
                    senderid = _smsConfig.SenderId,
                    messages = sms
                };

                var json = JsonSerializer.Serialize(data);
                var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
                var response = await client.PostAsync(ManySmsUrl, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!string.IsNullOrEmpty(responseContent))
                {
                    var result = JsonSerializer.Deserialize<BulkSMSApiResponse>(responseContent);
                    return result ?? new BulkSMSApiResponse();
                }

                return new BulkSMSApiResponse { response_code = (int)response.StatusCode };
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Failed to send bulk SMS");
                return new BulkSMSApiResponse { response_code = 500, error_message = ex.Message };
            }
        }
    }
}

