using System;
using System.Collections.Generic;

namespace OneWeb.Domain.Entities;

public class Blog : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public long? CategoryId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? AppContent { get; set; }
    public string? Image { get; set; }
    public bool Status { get; set; } = false;
    public string? MetaKeywords { get; set; }
    public string? MetaDescription { get; set; }

    // Navigation properties
    public virtual BlogCategory? Category { get; set; }
    public virtual ICollection<BlogTranslation> Translations { get; set; } = new List<BlogTranslation>();
}
