using OneWeb.Domain.Bulk;

namespace OneWeb.Infrastructure.Bulk
{
    public interface IBulkSMServices
    {
        Task<BulkSMSApiResponse> SendAsync(string mobile, string message);
        Task<BulkSMSApiResponse> SendAsync(List<SMS> sms);
    }
}
