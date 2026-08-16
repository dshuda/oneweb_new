using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OneWeb.Domain.Entities;

namespace OneWeb.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Email).HasMaxLength(255);
        builder.HasIndex(x => x.Email).IsUnique();
        
        builder.Property(x => x.Phone).HasMaxLength(50);
        builder.HasIndex(x => x.Phone);
        
        builder.Property(x => x.UserType).HasMaxLength(50);
        
        builder.Property(x => x.Status).HasDefaultValue(true);
        builder.Property(x => x.IsApproved).HasDefaultValue(false);
        builder.Property(x => x.IsBanned).HasDefaultValue(false);

        // Relationships
        builder.HasMany(x => x.Orders)
            .WithOne(f=>f.User)
            .HasForeignKey(f=>f.UserId);
            
        builder.HasMany(x => x.Addresses)
            .WithOne(x => x.User)
            .HasForeignKey(x => x.UserId);
            
        builder.HasOne(x => x.Vendor)
            .WithOne()
            .HasForeignKey<Vendor>("UserId");
    }
}
