using System;

namespace OneWeb.Domain.Entities;

public class BusinessSetting : BaseEntity
{
    public string Type { get; set; } = string.Empty;
    public string? Value { get; set; }
    public string? Lang { get; set; }
}
