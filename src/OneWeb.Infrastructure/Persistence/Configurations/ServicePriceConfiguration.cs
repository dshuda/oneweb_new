using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OneWeb.Domain.Entities;

namespace OneWeb.Infrastructure.Persistence.Configurations;

public class ServicePriceConfiguration : IEntityTypeConfiguration<ServicePrice>
{
    public void Configure(EntityTypeBuilder<ServicePrice> builder)
    {
        builder.ToTable("service_prices");
        builder.HasKey(x => x.Id);
    }
}
