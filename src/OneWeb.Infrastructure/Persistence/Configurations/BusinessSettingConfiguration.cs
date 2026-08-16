using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OneWeb.Domain.Entities;

namespace OneWeb.Infrastructure.Persistence.Configurations;

public class BusinessSettingConfiguration : IEntityTypeConfiguration<BusinessSetting>
{
    public void Configure(EntityTypeBuilder<BusinessSetting> builder)
    {
        builder.ToTable("business_settings");
        builder.HasKey(x => x.Id);
    }
}
