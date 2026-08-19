namespace OneWeb.Domain.Auth;

/// <summary>
/// Bootstrap credentials used to sign in without a live SMS gateway.
/// Bound from the "MasterAuth" section of appsettings.
/// </summary>
public class MasterAuthOptions
{
    public const string SectionName = "MasterAuth";

    /// <summary>Turn the whole bypass off in production.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>The phone number that always accepts <see cref="Otp"/>.</summary>
    public string Phone { get; set; } = "01708521990";

    /// <summary>The OTP accepted for <see cref="Phone"/>.</summary>
    public string Otp { get; set; } = "123456";

    /// <summary>Name given to the master account when it is created.</summary>
    public string Name { get; set; } = "Faruk Hannan";

    /// <summary>
    /// When true the master OTP is accepted for any phone number — handy while
    /// testing the site end to end, never appropriate in production.
    /// </summary>
    public bool AllowOtpForAllPhones { get; set; } = false;

    public bool IsMasterPhone(string? phone) =>
        Enabled && !string.IsNullOrWhiteSpace(phone) &&
        string.Equals(phone, Phone, StringComparison.Ordinal);

    /// <summary>True when the supplied OTP should be accepted without hitting Redis.</summary>
    public bool IsMasterOtp(string? phone, string? otp)
    {
        if (!Enabled || string.IsNullOrEmpty(otp) || !string.Equals(otp, Otp, StringComparison.Ordinal))
            return false;

        return AllowOtpForAllPhones || IsMasterPhone(phone);
    }
}
