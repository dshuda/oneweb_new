using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OneWeb.Domain.Entities;

namespace OneWeb.Infrastructure.Persistence.Configurations;

public class FcmTokenConfiguration : IEntityTypeConfiguration<FcmToken>
{
    public void Configure(EntityTypeBuilder<FcmToken> builder)
    {
        builder.ToTable("fcm_tokens");
        builder.HasKey(x => x.Id);
    }
}
