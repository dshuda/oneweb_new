namespace OneWeb.Api;

/// <summary>
/// Maps the deployment's environment-variable names (.env.prod) onto the
/// configuration keys the options classes bind to.
///
/// ASP.NET already understands the canonical "Section__Key" form; this adds the
/// shorter operational names the deployment files use, so nothing has to be
/// duplicated or hardcoded in appsettings. Canonical "Section__Key" variables
/// are applied after these and therefore still win.
/// </summary>
public static class EnvironmentConfiguration
{
    /// <summary>Environment variable name → configuration key.</summary>
    private static readonly Dictionary<string, string> KeyMap = new(StringComparer.OrdinalIgnoreCase)
    {
        // Public URLs
        ["FRONTEND_URL"] = "FrontendUrl",
        ["API_PUBLIC_BASE_URL"] = "SslCommerz:PublicBaseUrl",

        // SSL Wireless (SMS Plus v3)
        ["SSLWIRELESS_API_BASE"] = "SslWireless:ApiBase",
        ["SSLWIRELESS_SID"] = "SslWireless:Sid",
        ["SSLWIRELESS_API_KEY"] = "SslWireless:ApiToken",
        ["SSLWIRELESS_SENDER_ID"] = "SslWireless:MaskingSenderId",
        ["SSLWIRELESS_MASKING_ENABLED"] = "SslWireless:MaskingEnabled",
        ["SSLWIRELESS_NONMASKING_SENDER"] = "SslWireless:NonMaskingSender",
        ["SSLWIRELESS_NONMASKING_ENABLED"] = "SslWireless:NonMaskingEnabled",
        ["SSLWIRELESS_DLR_WEBHOOK_URL"] = "SslWireless:DlrWebhookUrl",

        // SSLCommerz
        ["SSLCOMMERZ_STORE_ID"] = "SslCommerz:StoreId",
        ["SSLCOMMERZ_STORE_PASSWORD"] = "SslCommerz:StorePassword",
        ["SSLCOMMERZ_API_VERSION"] = "SslCommerz:ApiVersion",
        ["SSLCOMMERZ_API_BASE_URL"] = "SslCommerz:ApiBaseUrl",
        ["SSLCOMMERZ_VALIDATION_BASE_URL"] = "SslCommerz:ValidationBaseUrl",
        ["SSLCOMMERZ_REFUND_BASE_URL"] = "SslCommerz:RefundBaseUrl",
        ["SSLCOMMERZ_CURRENCY"] = "SslCommerz:Currency",

        // DigitalOcean Spaces CDN
        ["SPACES_ACCESS_KEY_ID"] = "Cdn:AccessKey",
        ["SPACES_SECRET_ACCESS_KEY"] = "Cdn:SecretKey",
        ["SPACES_BUCKET_NAME"] = "Cdn:Bucket",
        ["SPACES_REGION"] = "Cdn:Region",
        ["SPACES_ENDPOINT"] = "Cdn:Endpoint",
        ["SPACES_CDN_ENDPOINT"] = "Cdn:CdnEndpoint",
        ["SPACES_ROOT_FOLDER"] = "Cdn:RootFolder"
    };

    /// <summary>
    /// Comma-separated variables that bind to a configuration array.
    /// </summary>
    private static readonly Dictionary<string, string> ListKeyMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["PAYMENT_ALLOWED_RETURN_ORIGINS"] = "SslCommerz:AllowedReturnOrigins"
    };

    public static IEnumerable<KeyValuePair<string, string?>> Build()
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);

        foreach (var (variable, key) in KeyMap)
        {
            var value = Environment.GetEnvironmentVariable(variable);
            // An empty variable means "not configured" — let appsettings stand.
            if (!string.IsNullOrWhiteSpace(value))
                values[key] = value.Trim();
        }

        foreach (var (variable, key) in ListKeyMap)
        {
            var value = Environment.GetEnvironmentVariable(variable);
            if (string.IsNullOrWhiteSpace(value)) continue;

            var index = 0;
            foreach (var entry in value.Split(',', StringSplitOptions.RemoveEmptyEntries))
            {
                var trimmed = entry.Trim();
                if (trimmed.Length > 0)
                    values[$"{key}:{index++}"] = trimmed;
            }
        }

        // The storefront origin is always a valid place to return a customer to.
        var frontend = Environment.GetEnvironmentVariable("FRONTEND_URL");
        if (!string.IsNullOrWhiteSpace(frontend) &&
            !values.Keys.Any(k => k.StartsWith("SslCommerz:AllowedReturnOrigins", StringComparison.OrdinalIgnoreCase)))
        {
            values["SslCommerz:AllowedReturnOrigins:0"] = frontend.Trim();
        }

        return values;
    }
}
