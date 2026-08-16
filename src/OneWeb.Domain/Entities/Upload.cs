using System;

namespace OneWeb.Domain.Entities;

public class Upload : BaseEntity
{
    public string? FileName { get; set; }
    public string? FilePath { get; set; }
    public string? FileType { get; set; }
    public long? FileSize { get; set; }
}
