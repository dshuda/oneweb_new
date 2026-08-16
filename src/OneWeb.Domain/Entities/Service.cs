using System;
using System.Collections.Generic;

namespace OneWeb.Domain.Entities;

public class Service : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public long? ParentId { get; set; } = 0; // 0 means top category
    public int Level { get; set; } = 0; // 0=category, 1=subcategory, 2=bookable leaf
    public double CommissionRate { get; set; } = 0;
    public string? ServiceIcon { get; set; }
    public string? BannerImage { get; set; }
    public double InitialPrice { get; set; } = 0;
    public string? About { get; set; } // HTML content
    public string? ServiceQuality { get; set; } // HTML content
    public string? FAQ { get; set; } // HTML content
    public string? Detail { get; set; } // HTML content
    public string? MetaTitle { get; set; }
    public string? MetaKeywords { get; set; }
    public string? MetaDescription { get; set; }
    public bool IsTrending { get; set; } = false;
    public bool Status { get; set; } = true;
    public long CreatedBy { get; set; }

    // Navigation properties
    public Service? Parent { get; set; }
    public ICollection<Service> Children { get; set; }
    public ICollection<ServicePrice> Prices { get; set; }
    public ICollection<ServiceSchedule> Schedules { get; set; } 
    public ICollection<Order> Orders { get; set; }
}
