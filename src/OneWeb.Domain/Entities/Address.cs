using System;

namespace OneWeb.Domain.Entities;

public class Address : BaseEntity
{
    public long? UserId { get; set; }
    public string? StreetAddress { get; set; }
    public long? CountryId { get; set; }
    public long? StateId { get; set; }
    public long? CityId { get; set; }

    // Navigation property
    public User? User { get; set; }
}
