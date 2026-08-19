using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;

namespace OneWeb.Infrastructure.Persistence;

/// <summary>
/// Seeds the service tree from the design catalogue exported by
/// tools/export-catalog.mjs (src/OneWeb.Api/Seed/catalog.json).
///
/// The website is where the catalogue is authored — names, imagery, prices and
/// copy — but the API is the runtime source of truth, because orders and
/// payments need stable service ids. This keeps the two in step.
///
/// Upserts by slug, so re-running is safe: existing rows are updated in place
/// and keep their ids (and therefore any orders that reference them).
/// </summary>
public static class CatalogSeeder
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public static async Task SeedAsync(AppDbContext db, string catalogPath, Action<string>? log = null)
    {
        if (!File.Exists(catalogPath))
        {
            log?.Invoke($"Catalog file not found at {catalogPath}; skipping catalogue seed.");
            return;
        }

        CatalogFile? catalog;
        await using (var stream = File.OpenRead(catalogPath))
        {
            catalog = await JsonSerializer.DeserializeAsync<CatalogFile>(stream, JsonOptions);
        }

        if (catalog?.Categories is not { Count: > 0 })
        {
            log?.Invoke("Catalog file contained no categories; skipping catalogue seed.");
            return;
        }

        // One round-trip for everything already stored, keyed by slug.
        var existing = await db.Services
            .Include(s => s.Prices)
            .Where(s => s.Slug != null)
            .ToDictionaryAsync(s => s.Slug!, StringComparer.OrdinalIgnoreCase);

        var counts = new SeedCounts();

        foreach (var category in catalog.Categories)
            await UpsertAsync(db, existing, category, parentId: null, counts);

        await db.SaveChangesAsync();

        log?.Invoke(
            $"Catalogue seeded: {counts.Inserted} added, {counts.Updated} updated, " +
            $"{counts.PricesInserted} package prices added.");
    }

    private static async Task UpsertAsync(
        AppDbContext db,
        Dictionary<string, Service> existing,
        CatalogNode node,
        long? parentId,
        SeedCounts counts)
    {
        if (string.IsNullOrWhiteSpace(node.Slug))
            return;

        if (!existing.TryGetValue(node.Slug, out var service))
        {
            service = new Service
            {
                Slug = node.Slug,
                CreatedAt = DateTime.UtcNow
            };
            db.Services.Add(service);
            existing[node.Slug] = service;
            counts.Inserted++;
        }
        else
        {
            counts.Updated++;
        }

        service.Name = node.Name;
        service.ParentId = parentId;
        service.Level = node.Level;
        service.ServiceIcon = node.ServiceIcon;
        service.BannerImage = node.BannerImage;
        service.InitialPrice = node.InitialPrice;
        service.IsTrending = node.IsTrending;
        service.PriceUnit = node.PriceUnit;
        service.Rating = node.Rating;
        service.ReviewCount = node.ReviewCount;
        service.HeroTitle = node.HeroTitle;
        service.HeroSubtitle = node.HeroSubtitle;
        service.Status = true;
        service.UpdatedAt = DateTime.UtcNow;

        // Children need this row's id, which only exists after a save.
        if (service.Id == 0)
            await db.SaveChangesAsync();

        SyncPrices(db, service, node.Prices, counts);

        foreach (var child in node.Children)
            await UpsertAsync(db, existing, child, service.Id, counts);
    }

    /// <summary>
    /// Match package prices by name so ids survive a reseed — an order's PriceId
    /// must keep pointing at the same package.
    /// </summary>
    private static void SyncPrices(AppDbContext db, Service service, List<CatalogPrice> prices, SeedCounts counts)
    {
        if (prices.Count == 0)
            return;

        service.Prices ??= new List<ServicePrice>();

        foreach (var price in prices)
        {
            var match = service.Prices.FirstOrDefault(
                p => string.Equals(p.Name, price.Name, StringComparison.OrdinalIgnoreCase));

            if (match == null)
            {
                db.ServicePrices.Add(new ServicePrice
                {
                    ServiceId = service.Id,
                    Name = price.Name,
                    Price = price.Price,
                    Status = true,
                    CreatedAt = DateTime.UtcNow
                });
                counts.PricesInserted++;
            }
            else
            {
                match.Price = price.Price;
                match.Status = true;
                match.UpdatedAt = DateTime.UtcNow;
            }
        }
    }

    private sealed class SeedCounts
    {
        public int Inserted;
        public int Updated;
        public int PricesInserted;
    }

    private sealed class CatalogFile
    {
        [JsonPropertyName("categories")]
        public List<CatalogNode> Categories { get; set; } = new();
    }

    private sealed class CatalogNode
    {
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public int Level { get; set; }
        public string? ServiceIcon { get; set; }
        public string? BannerImage { get; set; }
        public double InitialPrice { get; set; }
        public string? PriceUnit { get; set; }
        public double? Rating { get; set; }
        public int? ReviewCount { get; set; }
        public bool IsTrending { get; set; }
        public string? HeroTitle { get; set; }
        public string? HeroSubtitle { get; set; }
        public List<CatalogPrice> Prices { get; set; } = new();
        public List<CatalogNode> Children { get; set; } = new();
    }

    private sealed class CatalogPrice
    {
        public string Name { get; set; } = string.Empty;
        public double Price { get; set; }
    }
}
