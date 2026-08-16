using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OneWeb.Domain.Entities;

namespace OneWeb.Infrastructure.Persistence.Configurations;

public class CommissionHistoryConfiguration : IEntityTypeConfiguration<CommissionHistory>
{
    public void Configure(EntityTypeBuilder<CommissionHistory> builder)
    {
        builder.ToTable("commission_histories");
        builder.HasKey(x => x.Id);
    }
}
