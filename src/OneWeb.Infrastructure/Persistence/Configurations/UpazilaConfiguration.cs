using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OneWeb.Domain.Entities;

namespace OneWeb.Infrastructure.Persistence.Configurations;

public class UpazilaConfiguration : IEntityTypeConfiguration<Upazila>
{
    public void Configure(EntityTypeBuilder<Upazila> builder)
    {
        builder.ToTable("upazilas");
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.District)
            .WithMany()
            .HasForeignKey(x => x.DistrictId);
    }
}
