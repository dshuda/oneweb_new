using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OneWeb.Domain.Entities;

namespace OneWeb.Infrastructure.Persistence.Configurations;

public class DistrictConfiguration : IEntityTypeConfiguration<District>
{
    public void Configure(EntityTypeBuilder<District> builder)
    {
        builder.ToTable("districts");
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.Division)
            .WithMany()
            .HasForeignKey(x => x.DivisionId);
    }
}
