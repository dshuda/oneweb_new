using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OneWeb.Domain.Entities;

namespace OneWeb.Infrastructure.Persistence.Configurations;

public class CustomPageConfiguration : IEntityTypeConfiguration<CustomPage>
{
    public void Configure(EntityTypeBuilder<CustomPage> builder)
    {
        builder.ToTable("custom_pages");
        builder.HasKey(x => x.Id);

        // Clients fetch pages by Link, so it has to resolve to exactly one row.
        builder.HasIndex(x => x.Link).IsUnique();
        builder.HasIndex(x => x.Slug);

        builder.Property(x => x.Title).IsRequired();
        builder.Property(x => x.Link).IsRequired();
        builder.Property(x => x.Type).HasDefaultValue("web");
    }
}

public class CustomPageTranslationConfiguration : IEntityTypeConfiguration<CustomPageTranslation>
{
    public void Configure(EntityTypeBuilder<CustomPageTranslation> builder)
    {
        builder.ToTable("custom_page_translations");
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.Page)
            .WithMany(x => x.Translations)
            .HasForeignKey(x => x.PageId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
