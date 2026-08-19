using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;

namespace OneWeb.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // DbSets for all entities
    public DbSet<User> Users { get; set; }
    public DbSet<Vendor> Vendors { get; set; }
    public DbSet<Address> Addresses { get; set; }
    public DbSet<FcmToken> FcmTokens { get; set; }
    public DbSet<Service> Services { get; set; }
    public DbSet<ServicePrice> ServicePrices { get; set; }
    public DbSet<ServiceSchedule> ServiceSchedules { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderDetail> OrderDetails { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<Rating> Ratings { get; set; }
    public DbSet<Division> Divisions { get; set; }
    public DbSet<District> Districts { get; set; }
    public DbSet<Upazila> Upazilas { get; set; }
    public DbSet<BusinessSetting> BusinessSettings { get; set; }
    public DbSet<Slider> Sliders { get; set; }
    public DbSet<Blog> Blogs { get; set; }
    public DbSet<BlogCategory> BlogCategories { get; set; }
    public DbSet<BlogTranslation> BlogTranslations { get; set; }
    public DbSet<Coupon> Coupons { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<SupportTicket> SupportTickets { get; set; }
    public DbSet<Language> Languages { get; set; }
    public DbSet<ServiceTranslation> ServiceTranslations { get; set; }
    public DbSet<CustomPage> CustomPages { get; set; }
    public DbSet<CustomPageTranslation> CustomPageTranslations { get; set; }
    public DbSet<VendorWithdrawRequest> VendorWithdrawRequests { get; set; }
    public DbSet<CommissionHistory> CommissionHistories { get; set; }
    public DbSet<Upload> Uploads { get; set; }
    public DbSet<CouponUsage> CouponUsages { get; set; }
    public DbSet<VendorService> VendorServices { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all configurations from the assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // T2.4 — Global Query Filters for Soft Delete
        modelBuilder.Entity<User>().HasQueryFilter(u => u.DeletedAt == null);
    }
}
