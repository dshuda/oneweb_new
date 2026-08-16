using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OneWeb.Domain.Entities;

namespace OneWeb.Infrastructure.Persistence.Configurations;

public class BlogConfiguration : IEntityTypeConfiguration<Blog>
{
    public void Configure(EntityTypeBuilder<Blog> builder)
    {
        builder.ToTable("blogs");
        builder.HasKey(x => x.Id);

        builder.HasMany(x => x.Translations)
            .WithOne(x => x.Blog)
            .HasForeignKey(x => x.BlogId);
    }
}
