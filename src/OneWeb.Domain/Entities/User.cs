using System;
using System.Collections.Generic;

namespace OneWeb.Domain.Entities;

public class User : BaseEntity
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public DateTime? EmailVerifiedAt { get; set; }
    public string? VerificationCode { get; set; }
    public string? CountryCode { get; set; }
    public string? Phone { get; set; }
    public string? Gender { get; set; }
    public string? Dob { get; set; }
    public string? BloodGroup { get; set; }
    public string? FcmId { get; set; }
    public string? DeviceVersion { get; set; }
    public string? UserType { get; set; } // "admin", "vendor", "customer"
    public long? AssignVendorId { get; set; }
    public string? ImageId { get; set; }
    public string? Address { get; set; }
    public string? Latitude { get; set; }
    public string? Longitude { get; set; }
    public bool Status { get; set; } = true;
    public bool IsApproved { get; set; } = false;
    public bool IsBanned { get; set; } = false;
    public string? Password { get; set; }
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public ICollection<Order>? Orders { get; set; }
    public ICollection<Address> Addresses { get; set; } = new List<Address>();
    public ICollection<Rating> Ratings { get; set; } = new List<Rating>();
    public Vendor? Vendor { get; set; }
}
