using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OneWeb.Domain.Entities;

namespace OneWeb.Infrastructure.Persistence.Configurations;

public class VendorWithdrawRequestConfiguration : IEntityTypeConfiguration<VendorWithdrawRequest>
{
    public void Configure(EntityTypeBuilder<VendorWithdrawRequest> builder)
    {
        builder.ToTable("vendor_withdraw_requests");
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.Vendor)
            .WithMany()
            .HasForeignKey(x => x.VendorId);
    }
}
