using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OneWeb.Domain.Entities;

namespace OneWeb.Infrastructure.Persistence.Configurations;

public class VendorServiceConfiguration : IEntityTypeConfiguration<VendorService>
{
    public void Configure(EntityTypeBuilder<VendorService> builder)
    {
        builder.ToTable("vendor_services");
        builder.HasKey(x => x.Id);

        // Ensure each vendor-service pair is unique
        builder.HasIndex(x => new { x.VendorId, x.ServiceId }).IsUnique();

        builder.HasOne(x => x.Vendor)
            .WithMany(x => x.VendorServices)
            .HasForeignKey(x => x.VendorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Service)
            .WithMany()
            .HasForeignKey(x => x.ServiceId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
