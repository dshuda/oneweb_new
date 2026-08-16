using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OneWeb.Domain.Entities;
using System.Reflection.Emit;

namespace OneWeb.Infrastructure.Persistence.Configurations;

public class ServiceConfiguration : IEntityTypeConfiguration<Service>
{
    public void Configure(EntityTypeBuilder<Service> builder)
    {
        builder.ToTable("services");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).IsRequired().HasMaxLength(255);
        builder.Property(x => x.Slug).HasMaxLength(255);
        builder.HasIndex(x => x.Slug).IsUnique();
        
        builder.Property(x => x.ServiceQuality).HasColumnType("text");
        builder.Property(x => x.About).HasColumnType("text");

        builder.Property(x => x.About)
            .HasColumnType("text");

        builder.Property(x => x.FAQ)
            .HasColumnType("text");

        builder.Property(x => x.Detail)
            .HasColumnType("text");


        builder.HasIndex(x => new { x.ParentId, x.Level, x.Status });




        // Relationships

        builder.HasOne(x => x.Parent)
                .WithMany(x => x.Children)
                .HasForeignKey(x => x.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Prices)
            .WithOne(x => x.Service)
            .HasForeignKey(x => x.ServiceId);
            
        builder.HasMany(x => x.Schedules)
            .WithOne(x => x.Service)
            .HasForeignKey(x => x.ServiceId);
            
        builder.HasMany(x => x.Orders)
            .WithOne(f=>f.Service)
            .HasForeignKey(f => f.ServiceId);

    }
}
