using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OneWeb.Domain.Bulk;
using System.Reflection;
using System.Text;
using System.Text.Json;

namespace OneWeb.Infrastructure.Bulk
{
    public class BulkSMSServices : IBulkSMServices
    {
        private readonly BulkSMS _smsConfig;
      //  private ILogger _logger;
        private readonly string baseUrl = "http://bulksmsbd.net/api/smsapimany";
        public BulkSMSServices(IOptions<BulkSMS> smsOptions)
        {
            _smsConfig = smsOptions.Value;
          //  _logger = logger;
        }

        public async Task<BulkSMSApiResponse> SendAsync(string mobile, string message)
        {
            try
            {
                SMSData data = new SMSData(_smsConfig.SenderId, _smsConfig.Api_Key);
                var code = Random.Shared.Next(100000, 999999);
                data.messages = new List<SMS>();
                data.messages.Add(new SMS()
                {
                    message = message,
                    to = mobile
                });
                HttpClient client = new HttpClient();
                string json = JsonSerializer.Serialize(data);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await client.PostAsync(baseUrl, content);
                string responseContent = await response.Content.ReadAsStringAsync();
                var r = string.IsNullOrEmpty(responseContent) == false ? JsonSerializer.Deserialize<BulkSMSApiResponse>(responseContent) : new BulkSMSApiResponse();
               // _logger.LogInformation($" {mobile} - {responseContent}");
                return r;
            }
            catch (Exception)
            {
               // _logger.LogError($"Faild to send sms to {mobile} with error {ex.Message}");
                throw;
            }
        }

        public async Task<BulkSMSApiResponse> SendAsync(List<SMS> sms)
        {
            SMSData data = new SMSData(_smsConfig.SenderId, _smsConfig.Api_Key);
            var code = Random.Shared.Next(100000, 999999);
            data.messages = new List<SMS>();
            data.messages = sms;


            HttpClient client = new HttpClient();

            string json = JsonSerializer.Serialize(data);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await client.PostAsync(baseUrl, content);
            string responseContent = await response.Content.ReadAsStringAsync();

            var r = string.IsNullOrEmpty(responseContent) == false ? JsonSerializer.Deserialize<BulkSMSApiResponse>(responseContent) : new BulkSMSApiResponse();
            return r;
        }

        
    }
}
