namespace OneWeb.Domain.Sms;

/// <summary>
/// SSL Wireless SMS gateway settings, bound from the "SslWireless" configuration
/// section. Leave <see cref="ApiBase"/> empty to disable SMS in local development.
/// </summary>
public class SslWirelessOptions
{
    public const string SectionName = "SslWireless";

    /// <summary>Base URL of the gateway, e.g. https://smsplus.sslwireless.com.</summary>
    public string ApiBase { get; set; } = string.Empty;

    /// <summary>Issued by SSL Wireless — sent as "sid".</summary>
    public string Sid { get; set; } = string.Empty;

    /// <summary>Issued by SSL Wireless — sent as "api_token".</summary>
    public string ApiToken { get; set; } = string.Empty;

    /// <summary>BTRC-approved alphanumeric sender, used when masking is enabled.</summary>
    public string MaskingSenderId { get; set; } = string.Empty;

    public bool MaskingEnabled { get; set; } = false;

    /// <summary>Numeric sender used when masking is off or unavailable.</summary>
    public string NonMaskingSender { get; set; } = string.Empty;

    public bool NonMaskingEnabled { get; set; } = false;

    /// <summary>Seconds to wait on the gateway before giving up.</summary>
    public int TimeoutSeconds { get; set; } = 10;

    /// <summary>
    /// Delivery-report callback registered with SSL Wireless. Carried in config
    /// for the deployment's benefit; the receiving endpoint is not built yet.
    /// </summary>
    public string DlrWebhookUrl { get; set; } = string.Empty;

    /// <summary>True when enough is configured to attempt a send.</summary>
    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(ApiBase) &&
        !string.IsNullOrWhiteSpace(Sid) &&
        !string.IsNullOrWhiteSpace(ApiToken) &&
        (MaskingEnabled || NonMaskingEnabled);
}
