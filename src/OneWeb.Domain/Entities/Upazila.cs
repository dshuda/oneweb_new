namespace OneWeb.Domain.Entities;

public class Upazila : BaseEntity
{
    public long DistrictId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? BnName { get; set; }
    public bool Status { get; set; } = true;

    // Navigation property
    public District District { get; set; } = null!;
}
