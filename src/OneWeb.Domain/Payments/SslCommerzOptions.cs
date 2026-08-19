namespace OneWeb.Domain.Payments;

/// <summary>
/// SSLCommerz settings, bound from the "SslCommerz" configuration section.
/// </summary>
public class SslCommerzOptions
{
    public const string SectionName = "SslCommerz";

    public string StoreId { get; set; } = string.Empty;
    public string StorePassword { get; set; } = string.Empty;

    /// <summary>
    /// "3" → /gwprocess/v3/api.php, "4" → /gwprocess/v4/api.php. Only the
    /// session-init path differs between versions; validation, query and refund
    /// endpoints are identical. v3 is deprecated and returns an HTML notice, so
    /// v4 is the default.
    /// </summary>
    public string ApiVersion { get; set; } = "4";

    public string ApiBaseUrl { get; set; } = "https://sandbox.sslcommerz.com";
    public string ValidationBaseUrl { get; set; } = "https://sandbox.sslcommerz.com";
    public string RefundBaseUrl { get; set; } = "https://sandbox.sslcommerz.com";

    /// <summary>
    /// Public base URL of this API — SSLCommerz calls back here. Leave empty to
    /// derive it from the incoming request, which is right for local dev; set it
    /// explicitly behind a proxy or tunnel, where the request host is not the
    /// address SSLCommerz can reach.
    /// </summary>
    public string PublicBaseUrl { get; set; } = string.Empty;

    /// <summary>
    /// Where the customer lands after the gateway finishes, when the client did
    /// not supply its own returnUrl. Defaults to the app-wide "FrontendUrl".
    /// </summary>
    public string FrontendReturnUrl { get; set; } = string.Empty;

    /// <summary>
    /// Origins a client-supplied returnUrl may point at. Without this any caller
    /// could turn the callback into an open redirect. The origin of
    /// <see cref="FrontendReturnUrl"/> is always allowed.
    /// </summary>
    public List<string> AllowedReturnOrigins { get; set; } = new();

    public string Currency { get; set; } = "BDT";
    public int TimeoutSeconds { get; set; } = 30;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(StoreId) &&
        !string.IsNullOrWhiteSpace(StorePassword);

    /// <summary>Session-initiation endpoint for the configured API version.</summary>
    public string SessionEndpoint =>
        $"{ApiBaseUrl.TrimEnd('/')}/gwprocess/v{(ApiVersion is "3" or "4" ? ApiVersion : "4")}/api.php";

    public string ValidationEndpoint =>
        $"{ValidationBaseUrl.TrimEnd('/')}/validator/api/validationserverAPI.php";

    public string TransactionQueryEndpoint =>
        $"{ValidationBaseUrl.TrimEnd('/')}/validator/api/merchantTransIDvalidationAPI.php";

    public string RefundEndpoint =>
        $"{RefundBaseUrl.TrimEnd('/')}/validator/api/merchantTransIDvalidationAPI.php";
}
