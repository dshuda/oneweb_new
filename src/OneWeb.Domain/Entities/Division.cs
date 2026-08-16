namespace OneWeb.Domain.Entities;

public class Division : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? BnName { get; set; }
    public bool Status { get; set; } = true;
}
