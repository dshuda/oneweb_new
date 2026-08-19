using Microsoft.AspNetCore.Mvc;
using MediatR;
using OneWeb.Application.Features.Services.Queries;
using OneWeb.Api.Localization;

namespace OneWeb.Api.Controllers;

[ApiController]
[Route("api/v1/services")]
public class ServicesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly TranslationOverlay _translations;

    public ServicesController(IMediator mediator, TranslationOverlay translations)
    {
        _mediator = mediator;
        _translations = translations;
    }

    /// <summary>Return the payload localised when a non-default locale is asked for.</summary>
    private async Task<IActionResult> Localised(object? payload, string? lang)
    {
        var locale = await _translations.ResolveLocaleAsync(Request, lang);
        if (locale == null) return Ok(payload);

        var translated = await _translations.ApplyAsync(payload, locale);
        return Ok(translated ?? payload);
    }
    
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories([FromQuery] string? lang = null)
    {
        var result = await _mediator.Send(new GetCategoriesQuery());
        return await Localised(result, lang);
    }
    
    [HttpGet()]
    public async Task<IActionResult> GetServices(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 15,
        [FromQuery] string? search = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] string? lang = null)
    {
        var result = await _mediator.Send(new GetServicesQuery(page, pageSize, search, categoryId));
        return await Localised(result, lang);
    }
    
    [HttpGet("{slug}")]
    public async Task<IActionResult> GetServiceBySlug(string slug, [FromQuery] string? lang = null)
    {
        var result = await _mediator.Send(new GetServiceBySlugQuery(slug));
        if (result == null)  return NotFound();

        return await Localised(result, lang);
    }

    [HttpGet("detail")]
    public async Task<IActionResult> GetServiceById([FromQuery] int Id, [FromQuery] string? lang = null)
    {
        var result = await _mediator.Send(new GetServiceByIdQuery(Id));

        if (result == null)            return NotFound();
        return await Localised(result, lang);
    }
}
