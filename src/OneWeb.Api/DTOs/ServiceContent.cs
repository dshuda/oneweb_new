namespace OneWeb.Api.DTOs
{
    public class ServiceContent
    {
        public long ServiceId { get; set; }
        public string? OverView { get; set; }
        public List<Faqs> Faqs { get; set; }
        public string?    Details {get;set;}
    }

    public record Faqs
    {
        public string? Quetion { get; set; }
        public string? Answer { get; set; }
    }
}
