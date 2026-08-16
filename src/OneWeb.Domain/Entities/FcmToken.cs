using System;

namespace OneWeb.Domain.Entities;

public class FcmToken : BaseEntity
{
    public long UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public string? DeviceType { get; set; } // "android" or "ios"
}
