namespace OneWeb.Domain.Entities;

public class District : BaseEntity
{
    public long DivisionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? BnName { get; set; }
    public string? Lat { get; set; }
    public string? Long { get; set; }
    public bool Status { get; set; } = true;

    // Navigation property
    public Division Division { get; set; } = null!;
}
