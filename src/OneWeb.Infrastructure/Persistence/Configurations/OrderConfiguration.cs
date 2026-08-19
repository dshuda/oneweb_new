using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OneWeb.Domain.Entities;

namespace OneWeb.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("orders");
        builder.HasKey(x => x.Id);

        // PostGIS point in WGS84; spatially indexed so "orders near X" is cheap.
        builder.Property(x => x.Location).HasColumnType("geometry(Point,4326)");
        builder.HasIndex(x => x.Location).HasMethod("gist");


        builder.Property(p => p.ServiceDate);


        builder.Property(x => x.DeliveryStatus)
            .HasMaxLength(50)
            .HasDefaultValue("pending");
            
        builder.Property(x => x.PaymentStatus)
            .HasMaxLength(50)
            .HasDefaultValue("unpaid");
            
        builder.Property(x => x.OrderFrom)
            .HasDefaultValue("app");
            
        builder.Property(x => x.DeliverStatusJson)
            .HasColumnType("jsonb");
            
        builder.Property(x => x.IsCancelled)
            .HasDefaultValue(0);

        builder.HasIndex(x => x.UserId);
        builder.HasIndex(x => x.VendorId);
        builder.HasIndex(x => x.DeliveryStatus);

        // Relationships
        builder.HasOne(x => x.User)
            .WithMany(x => x.Orders)
            .HasForeignKey(x => x.UserId);

        builder.HasOne(x => x.Service)
            .WithMany(f => f.Orders).HasForeignKey(
            s => s.ServiceId);

        builder.HasOne(x => x.Detail)
            .WithOne(x => x.Order)
            .HasForeignKey<OrderDetail>(x => x.OrderId);
            
        builder.HasOne(x => x.Payment)
            .WithOne()
            .HasForeignKey<Payment>(f=>f.OrderId);
            
        builder.HasOne(x => x.Rating)
            .WithOne()
            .HasForeignKey<Rating>("OrderId");
    }
}
