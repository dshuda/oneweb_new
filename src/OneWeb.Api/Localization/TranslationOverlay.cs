using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api.Localization;

/// <summary>
/// Applies a locale's copy over an already-built response.
///
/// The service DTOs are produced by MediatR handlers and reshaped over time, so
/// rather than threading a locale through every handler and projection, the
/// response is overlaid as JSON: fields that have a translation are replaced,
/// everything else is untouched. Missing translations silently fall back to the
/// base row, which is what a partially translated catalogue needs.
/// </summary>
public sealed class TranslationOverlay
{
    /// <summary>
    /// Must match how ASP.NET serialises responses (camelCase). Serialising with
    /// the default PascalCase would produce keys that never match the real
    /// payload, so the overlay would silently do nothing.
    /// </summary>
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    private readonly AppDbContext _dbContext;

    public TranslationOverlay(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// Resolves the requested locale: explicit query value first, then the
    /// "lang" header the Laravel apps already send, then the default language.
    /// Returns null when the resolved locale is the default (nothing to do).
    /// </summary>
    public async Task<string?> ResolveLocaleAsync(HttpRequest request, string? queryLang)
    {
        var wanted = queryLang;

        if (string.IsNullOrWhiteSpace(wanted) && request.Headers.TryGetValue("lang", out var header))
            wanted = header.ToString();

        if (string.IsNullOrWhiteSpace(wanted))
            return null;

        wanted = wanted.Trim().ToLowerInvariant();

        var language = await _dbContext.Languages
            .FirstOrDefaultAsync(l => l.Code == wanted && l.Status);

        // Unknown or default locale: serve the base content unchanged.
        return language == null || language.IsDefault ? null : language.Code;
    }

    /// <summary>Overlay translations onto any payload containing service nodes.</summary>
    public async Task<JsonNode?> ApplyAsync(object? payload, string lang)
    {
        if (payload == null) return null;

        var node = JsonSerializer.SerializeToNode(payload, payload.GetType(), SerializerOptions);
        if (node == null) return null;

        var ids = new HashSet<long>();
        CollectServiceIds(node, ids);
        if (ids.Count == 0) return node;

        var translations = await _dbContext.ServiceTranslations
            .Where(t => t.Lang == lang && ids.Contains(t.ServiceId))
            .ToDictionaryAsync(t => t.ServiceId);

        if (translations.Count == 0) return node;

        Overlay(node, translations.ToDictionary(
            kv => kv.Key,
            kv => new Dictionary<string, string?>
            {
                ["name"] = kv.Value.Name,
                ["about"] = kv.Value.About,
                ["detail"] = kv.Value.Detail,
                ["serviceQuality"] = kv.Value.ServiceQuality,
                ["faq"] = kv.Value.FAQ,
                ["heroTitle"] = kv.Value.HeroTitle,
                ["heroSubtitle"] = kv.Value.HeroSubtitle,
            }));

        return node;
    }

    /// <summary>Walk the tree gathering every object that looks like a service.</summary>
    private static void CollectServiceIds(JsonNode? node, HashSet<long> ids)
    {
        switch (node)
        {
            case JsonArray array:
                foreach (var item in array) CollectServiceIds(item, ids);
                break;

            case JsonObject obj:
                // A service node carries both an id and a name.
                if (obj.TryGetPropertyValue("id", out var idNode) &&
                    obj.ContainsKey("name") &&
                    idNode is JsonValue idValue &&
                    idValue.TryGetValue<long>(out var id))
                {
                    ids.Add(id);
                }

                foreach (var property in obj) CollectServiceIds(property.Value, ids);
                break;
        }
    }

    private static void Overlay(JsonNode? node, Dictionary<long, Dictionary<string, string?>> byId)
    {
        switch (node)
        {
            case JsonArray array:
                foreach (var item in array) Overlay(item, byId);
                break;

            case JsonObject obj:
                if (obj.TryGetPropertyValue("id", out var idNode) &&
                    idNode is JsonValue idValue &&
                    idValue.TryGetValue<long>(out var id) &&
                    byId.TryGetValue(id, out var fields))
                {
                    foreach (var (key, value) in fields)
                    {
                        // Only replace fields the response actually exposes, and
                        // only when the translation has something to say.
                        if (!string.IsNullOrWhiteSpace(value) && obj.ContainsKey(key))
                            obj[key] = value;
                    }
                }

                foreach (var property in obj.ToList()) Overlay(property.Value, byId);
                break;
        }
    }
}
