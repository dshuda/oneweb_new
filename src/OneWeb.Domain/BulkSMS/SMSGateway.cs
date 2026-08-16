namespace OneWeb.Domain.Bulk;

public class BulkSMS
{
    public string SenderId { get; set; }
    public string Api_Key { get; set; }
}
public class SMSData
{
    public string senderid { get; private set; }
    public string api_key { get; private set; }

    public List<SMS> messages { get; set; }
    public SMSData(string senderId, string ApiKey)
    {
        senderid = senderId;
        api_key = ApiKey;
    }
}
public record SMS
{
    public string message { get; set; }
    public string to { get; set; }

}
public class BulkSMSApiResponse
{
    public int response_code { get; set; }
    public string success_message { get; set; }
    public string error_message { get; set; }
}
