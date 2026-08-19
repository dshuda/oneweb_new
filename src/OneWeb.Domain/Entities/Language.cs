using System;
using System.Collections.Generic;

namespace OneWeb.Domain.Entities;

/// <summary>
/// A locale the storefront and apps can be served in. Ported from the Laravel
/// Language model, which drove the locale switcher and the *_translations tables.
/// </summary>
public class Language : BaseEntity
{
    /// <summary>ISO code used in the <c>lang</c> query string and header, e.g. "bn".</summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>English name, e.g. "Bengali".</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Endonym shown in the switcher, e.g. "বাংলা".</summary>
    public string? NativeName { get; set; }

    /// <summary>Right-to-left scripts need the UI mirrored.</summary>
    public bool Rtl { get; set; } = false;

    /// <summary>Used when the request names no locale, or names an unknown one.</summary>
    public bool IsDefault { get; set; } = false;

    public bool Status { get; set; } = true;
}

/// <summary>
/// Localised copy for a service. Only the customer-visible fields are
/// translated; prices, images and slugs stay shared across locales.
/// </summary>
public class ServiceTranslation : BaseEntity
{
    public long ServiceId { get; set; }
    public string Lang { get; set; } = string.Empty;

    public string? Name { get; set; }
    public string? About { get; set; }
    public string? Detail { get; set; }
    public string? ServiceQuality { get; set; }
    public string? FAQ { get; set; }
    public string? HeroTitle { get; set; }
    public string? HeroSubtitle { get; set; }

    public virtual Service? Service { get; set; }
}
