using System;

namespace OneWeb.Domain.Entities;

public class BlogTranslation : BaseEntity
{
    public string? Lang { get; set; }
    public long BlogId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? AppContent { get; set; }

    // Navigation property
    public Blog Blog { get; set; } = null!;
}
