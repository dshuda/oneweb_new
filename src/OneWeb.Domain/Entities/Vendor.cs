using System;

namespace OneWeb.Domain.Entities;

public class Vendor : BaseEntity
{
    public long UserId { get; set; }
    public double CommissionRate { get; set; } = 0;
    public double PendingBalance { get; set; } = 0;
    public double Balance { get; set; } = 0;
    public double TotalEarnings { get; set; } = 0;
    public string? Type { get; set; }
    public int? CashPaymentStatus { get; set; }
    public bool MobilePaymentStatus { get; set; } = false;
    public int? BankPaymentStatus { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountName { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankRoutingNumber { get; set; }
    public long? Division { get; set; }
    public long? District { get; set; }
    public string? Address { get; set; }
    public string? ShortBiography { get; set; }
    public string? Cv { get; set; }
    public string? Nid { get; set; }
    public string? TinNumber { get; set; }
    public string? BinNumber { get; set; }
    public string? TradeLicense { get; set; }
    public string? AcademicCertificate { get; set; }
    public string? WorkExperience { get; set; }
    public bool Status { get; set; } = true;

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual ICollection<VendorService> VendorServices { get; set; } = new List<VendorService>();
}
