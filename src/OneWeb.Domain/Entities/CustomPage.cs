using System;
using System.Collections.Generic;

namespace OneWeb.Domain.Entities;

/// <summary>
/// Static content pages (terms, privacy, about, contact) rendered by the
/// storefront and the mobile app. Ported from the Laravel custom_pages table:
/// <c>Link</c> is the stable key a client asks for, while <c>Slug</c> is the
/// public URL segment, and <c>Type</c> separates web-only from app-only copy.
/// </summary>
public class CustomPage : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;

    /// <summary>Stable lookup key, e.g. "terms". Clients request pages by this.</summary>
    public string Link { get; set; } = string.Empty;

    /// <summary>"web" or "app" — which surface the copy is written for.</summary>
    public string Type { get; set; } = "web";

    public string? Content { get; set; }
    public bool Status { get; set; } = false;
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? MetaKeywords { get; set; }

    public virtual ICollection<CustomPageTranslation> Translations { get; set; } = new List<CustomPageTranslation>();
}

public class CustomPageTranslation : BaseEntity
{
    public long PageId { get; set; }
    public string? Lang { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }

    public virtual CustomPage? Page { get; set; }
}
