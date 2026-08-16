using Microsoft.AspNetCore.Mvc;
using MediatR;
using OneWeb.Application.Features.Services.Queries;

namespace OneWeb.Api.Controllers;

[ApiController]
[Route("api/v1/services")]
public class ServicesController : ControllerBase
{
    private readonly IMediator _mediator;
    
    public ServicesController(IMediator mediator)
    {
        _mediator = mediator;
    }
    
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var result = await _mediator.Send(new GetCategoriesQuery());
        return Ok(result);
    }
    
    [HttpGet()]
    public async Task<IActionResult> GetServices(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 15,
        [FromQuery] string? search = null,
        [FromQuery] int? categoryId = null)
    {
        var result = await _mediator.Send(new GetServicesQuery(page, pageSize, search, categoryId));
        return Ok(result);
    }
    
    [HttpGet("{slug}")]
    public async Task<IActionResult> GetServiceBySlug(string slug)
    {
        var result = await _mediator.Send(new GetServiceBySlugQuery(slug));
        if (result == null)  return NotFound();
        
        return Ok(result);
    }

    [HttpGet("detail")]
    public async Task<IActionResult> GetServiceById([FromQuery] int Id)
    {
        var result = await _mediator.Send(new GetServiceByIdQuery(Id));
        
        if (result == null)            return NotFound();
        return Ok(result);
    }
}
