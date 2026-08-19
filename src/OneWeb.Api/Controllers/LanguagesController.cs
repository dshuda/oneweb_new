using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api.Controllers;

/// <summary>
/// Locales and per-service translations. Ported from the Laravel Language model
/// and *_translations tables; the Laravel app resolved the locale in middleware
/// from a "lang" header, so the same key is honoured here.
/// </summary>
[ApiController]
[Route("api/v1/languages")]
public class LanguagesController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public LanguagesController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Public: what the storefront switcher offers.
    [HttpGet]
    public async Task<IActionResult> GetLanguages()
    {
        var languages = await _dbContext.Languages
            .Where(l => l.Status)
            .OrderByDescending(l => l.IsDefault)
            .ThenBy(l => l.Name)
            .Select(l => new { l.Id, l.Code, l.Name, l.NativeName, l.Rtl, l.IsDefault })
            .ToListAsync();

        return Ok(languages);
    }

    [HttpGet("/api/v1/admin/languages")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> GetAll()
    {
        var languages = await _dbContext.Languages
            .OrderByDescending(l => l.IsDefault)
            .ThenBy(l => l.Name)
            .Select(l => new
            {
                l.Id, l.Code, l.Name, l.NativeName, l.Rtl, l.IsDefault, l.Status,
                Translated = _dbContext.ServiceTranslations.Count(t => t.Lang == l.Code),
            })
            .ToListAsync();

        return Ok(languages);
    }

    [HttpPost("/api/v1/admin/languages")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> Create([FromBody] SaveLanguageRequest request)
    {
        var code = (request.Code ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Code and name are both required" });

        if (await _dbContext.Languages.AnyAsync(l => l.Code == code))
            return Conflict(new { message = $"Language \"{code}\" already exists" });

        var language = new Language
        {
            Code = code,
            Name = request.Name.Trim(),
            NativeName = request.NativeName,
            Rtl = request.Rtl,
            Status = request.Status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        if (request.IsDefault) await MakeDefault(language);

        _dbContext.Languages.Add(language);
        await _dbContext.SaveChangesAsync();

        return Created($"/api/v1/languages", new { language.Id });
    }

    [HttpPut("/api/v1/admin/languages/{id:long}")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> Update(long id, [FromBody] SaveLanguageRequest request)
    {
        var language = await _dbContext.Languages.FirstOrDefaultAsync(l => l.Id == id);
        if (language == null) return NotFound();

        language.Name = request.Name?.Trim() ?? language.Name;
        language.NativeName = request.NativeName;
        language.Rtl = request.Rtl;
        language.Status = request.Status;
        language.UpdatedAt = DateTime.UtcNow;

        if (request.IsDefault && !language.IsDefault)
        {
            await MakeDefault(language);
            language.IsDefault = true;
        }

        await _dbContext.SaveChangesAsync();
        return Ok(new { message = "Language updated" });
    }

    [HttpDelete("/api/v1/admin/languages/{id:long}")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> Delete(long id)
    {
        var language = await _dbContext.Languages.FirstOrDefaultAsync(l => l.Id == id);
        if (language == null) return NotFound();

        if (language.IsDefault)
            return BadRequest(new { message = "The default language cannot be deleted" });

        // Orphaned translations would otherwise linger and never be served.
        var translations = await _dbContext.ServiceTranslations
            .Where(t => t.Lang == language.Code)
            .ToListAsync();
        _dbContext.ServiceTranslations.RemoveRange(translations);

        _dbContext.Languages.Remove(language);
        await _dbContext.SaveChangesAsync();
        return Ok(new { message = "Language deleted" });
    }

    /// <summary>Translations for one service, keyed by locale.</summary>
    [HttpGet("/api/v1/admin/services/{serviceId:long}/translations")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> GetServiceTranslations(long serviceId)
    {
        var translations = await _dbContext.ServiceTranslations
            .Where(t => t.ServiceId == serviceId)
            .Select(t => new
            {
                t.Id, t.Lang, t.Name, t.About, t.Detail,
                t.ServiceQuality, t.FAQ, t.HeroTitle, t.HeroSubtitle,
            })
            .ToListAsync();

        return Ok(translations);
    }

    /// <summary>Upsert one locale's copy for a service.</summary>
    [HttpPut("/api/v1/admin/services/{serviceId:long}/translations/{lang}")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> SaveServiceTranslation(
        long serviceId, string lang, [FromBody] SaveTranslationRequest request)
    {
        if (!await _dbContext.Services.AnyAsync(s => s.Id == serviceId))
            return NotFound(new { message = "Service not found" });

        var code = lang.Trim().ToLowerInvariant();
        if (!await _dbContext.Languages.AnyAsync(l => l.Code == code))
            return BadRequest(new { message = $"Unknown language \"{code}\"" });

        var translation = await _dbContext.ServiceTranslations
            .FirstOrDefaultAsync(t => t.ServiceId == serviceId && t.Lang == code);

        if (translation == null)
        {
            translation = new ServiceTranslation
            {
                ServiceId = serviceId,
                Lang = code,
                CreatedAt = DateTime.UtcNow,
            };
            _dbContext.ServiceTranslations.Add(translation);
        }

        translation.Name = request.Name;
        translation.About = request.About;
        translation.Detail = request.Detail;
        translation.ServiceQuality = request.ServiceQuality;
        translation.FAQ = request.FAQ;
        translation.HeroTitle = request.HeroTitle;
        translation.HeroSubtitle = request.HeroSubtitle;
        translation.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return Ok(new { message = "Translation saved" });
    }

    [HttpDelete("/api/v1/admin/services/{serviceId:long}/translations/{lang}")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> DeleteServiceTranslation(long serviceId, string lang)
    {
        var code = lang.Trim().ToLowerInvariant();
        var translation = await _dbContext.ServiceTranslations
            .FirstOrDefaultAsync(t => t.ServiceId == serviceId && t.Lang == code);

        if (translation == null) return NotFound();

        _dbContext.ServiceTranslations.Remove(translation);
        await _dbContext.SaveChangesAsync();
        return Ok(new { message = "Translation removed" });
    }

    /// <summary>Only one language may be the default, so clear the previous one.</summary>
    private async Task MakeDefault(Language incoming)
    {
        var current = await _dbContext.Languages.Where(l => l.IsDefault).ToListAsync();
        foreach (var l in current) l.IsDefault = false;
        incoming.IsDefault = true;
    }

    public record SaveLanguageRequest(
        string? Code, string? Name, string? NativeName, bool Rtl, bool IsDefault, bool Status);

    public record SaveTranslationRequest(
        string? Name, string? About, string? Detail, string? ServiceQuality,
        string? FAQ, string? HeroTitle, string? HeroSubtitle);
}
