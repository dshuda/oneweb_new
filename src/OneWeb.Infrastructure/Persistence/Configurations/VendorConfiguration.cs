using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OneWeb.Domain.Entities;

namespace OneWeb.Infrastructure.Persistence.Configurations;

public class VendorConfiguration : IEntityTypeConfiguration<Vendor>
{
    public void Configure(EntityTypeBuilder<Vendor> builder)
    {
        builder.ToTable("vendors");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Balance).HasDefaultValue(0.0);
        builder.Property(x => x.PendingBalance).HasDefaultValue(0.0);
        builder.Property(x => x.TotalEarnings).HasDefaultValue(0.0);

        // Relationship with User
        builder.HasOne(x => x.User)
            .WithOne(x => x.Vendor)
            .HasForeignKey<Vendor>(x => x.UserId);
    }
}
