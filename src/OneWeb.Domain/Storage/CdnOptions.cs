namespace OneWeb.Domain.Storage;

/// <summary>
/// DigitalOcean Spaces (S3-compatible) settings, bound from the "Cdn"
/// configuration section. Uploads go to the Spaces endpoint; public URLs are
/// served from the CDN edge endpoint.
/// </summary>
public class CdnOptions
{
    public const string SectionName = "Cdn";

    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;

    /// <summary>Bucket ("Space") name, e.g. "lcst".</summary>
    public string Bucket { get; set; } = string.Empty;

    /// <summary>Spaces region, e.g. "sgp1".</summary>
    public string Region { get; set; } = "sgp1";

    /// <summary>Origin endpoint used for uploads.</summary>
    public string Endpoint { get; set; } = "https://sgp1.digitaloceanspaces.com";

    /// <summary>Edge endpoint used to build public URLs.</summary>
    public string CdnEndpoint { get; set; } = string.Empty;

    /// <summary>
    /// Prefix every object with this folder to keep tenants apart. Matches the
    /// "Onetap" folder the deployed server already writes to, so existing image
    /// URLs stay consistent — the casing matters.
    /// </summary>
    public string RootFolder { get; set; } = "Onetap";

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(AccessKey) &&
        !string.IsNullOrWhiteSpace(SecretKey) &&
        !string.IsNullOrWhiteSpace(Bucket);
}
