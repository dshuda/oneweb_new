using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OneWeb.Domain.Entities;

namespace OneWeb.Infrastructure.Persistence.Configurations;

public class BlogTranslationConfiguration : IEntityTypeConfiguration<BlogTranslation>
{
    public void Configure(EntityTypeBuilder<BlogTranslation> builder)
    {
        builder.ToTable("blog_translations");
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.Blog)
            .WithMany(x => x.Translations)
            .HasForeignKey(x => x.BlogId);
    }
}
