using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using OneWeb.Api.DTOs;
using OneWeb.Application.Features.Services.Commands;
using OneWeb.Application.Features.Services.Queries;

namespace OneWeb.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/services")]
[Authorize(Roles = "admin,staff")]
public class ServicesAdminController : ControllerBase
{
    private readonly IMediator _mediator;
    public ServicesAdminController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var result = await _mediator.Send(new GetAdminCategoriesQuery());
        return ApiResponseFactory.Ok(result, HttpContext);
    }

    [HttpGet("services-root")]
    public async Task<IActionResult> GetRottServices([FromQuery] GetRootServicesQuery query)
    {
        var result = await _mediator.Send(query);
        return ApiResponseFactory.Ok(result, HttpContext);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateService(long id, [FromBody] UpdateServiceRequest request)
    {
        var result = await _mediator.Send(new UpdateServiceCommand
        {
            Id = id,
            Name = request.Name,
            Slug = request.Slug,
            ParentId = request.ParentId,
            BannerImage = request.BannerImage,
            ServiceIcon = request.ServiceIcon,
            PriceUnit = request.PriceUnit,
            Rating = request.Rating,
            ReviewCount = request.ReviewCount,
            HeroTitle = request.HeroTitle,
            HeroSubtitle = request.HeroSubtitle,
            Level = request.Level,
            InitialPrice = request.InitialPrice,
            Status = request.Status
        });

        if (!result)
            return BadRequest(ApiResponseFactory.Fail(new ErrorDescriptor { Code = "SERVICE_NOT_FOUND", Message = "Unable to update service", StatusCode = 400 }, HttpContext));
        return ApiResponseFactory.Accepted(request, HttpContext);
    }

    [HttpPost]
    public async Task<IActionResult> CreateService([FromBody] CreateServiceRequest request)
    {
        var result = await _mediator.Send(new CreateServiceCommand
        {
            Name = request.Name,
            Slug = request.Slug,
            ParentId = request.ParentId,
            BannerImage = request.BannerImage,
            ServiceIcon = request.ServiceIcon,
            PriceUnit = request.PriceUnit,
            Rating = request.Rating,
            ReviewCount = request.ReviewCount,
            HeroTitle = request.HeroTitle,
            HeroSubtitle = request.HeroSubtitle,
            Level = request.Level,
            InitialPrice = request.InitialPrice,
            Status = request.Status
        });
        return ApiResponseFactory.Created(result, HttpContext, "");
        // return CreatedAtAction(nameof(UpdateService), new { id = result }, new { id = result, message = "Service created successfully" });
    }


    [HttpPost("add-pricing")]
    public async Task<IActionResult> AddPricing([FromBody] AddPricingRequest request)
    {
        var result = await _mediator.Send(new CreateServicePriceCommand()
        {
            Name = request.Name,
            Price = request.Price,
            ServiceId = request.ServiceId
        });
        return ApiResponseFactory.Created(result, HttpContext, "");
    }
    [HttpPut("update-price/{id}")]
    public async Task<IActionResult> UpdatePrice(long id, [FromBody] AddPricingRequest request)
    {
        var result = await _mediator.Send(new UpdateServicePriceCommand()
        {
            Id = id,
            Name = request.Name,
            Price = request.Price,
            ServiceId = request.ServiceId,
            Status = request.Status
        });
        return ApiResponseFactory.Created(result, HttpContext, "");
    }

    [HttpDelete("remove-pricing/{id}")]
    public async Task<IActionResult> RemovePricing(long id)
    {
        await _mediator.Send(new DeleteServicePriceCommand(id));
        return ApiResponseFactory.Accepted(id, HttpContext);
    }


    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteService(long id)
    {
        var result = await _mediator.Send(new DeleteServiceCommand(id));

        if (!result)
            return BadRequest(new { message = "Unable to delete service" });

        return Ok(new { message = "Service deleted successfully" });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Details(long id)
    {
        var result = await _mediator.Send(new GetServiceByIdQuery(id));

        if (result == null)
            return BadRequest(ApiResponseFactory.Fail(new ErrorDescriptor()
            {
                Code = "NOT FOUND",
                Message = "Service Not Found with Supplied ID",
                StatusCode = 404
            }, HttpContext));

        return ApiResponseFactory.Ok(result, HttpContext);
    }



    /// <summary>
    /// New Content Section
    /// </summary>
    [HttpPut("content/{id}")]
    public async Task<IActionResult> SaveOrUpdateContentAsync(long Id, [FromBody] ServiceContentCommand command)
    {
        command.Id = Id;
       var re =  await _mediator.Send(command);
        return ApiResponseFactory.Created(re, HttpContext, "");

    }

    [HttpGet("content/{id}")]
    public async Task<IActionResult> GetContentAsync(long Id)
    {
    
       var re =  await _mediator.Send(new GetServiceHtmlContentQuery() { Id = Id});
        return ApiResponseFactory.Ok(re, HttpContext);

    }


    public record RemovePricingRequest
    {
        public long Id { get; set; }
    }

    public record AddPricingRequest
    {
        public long ServiceId { get; set; }
        public string? Name { get; set; }
        public double Price { get; set; }
        public bool Status { get; set; }
    }

    public record CreateServiceRequest(
        string Name,
        string? Slug,
        string? BannerImage,
        long? ParentId,
        string? ServiceIcon,
        string? PriceUnit,
        double? Rating,
        int? ReviewCount,
        string? HeroTitle,
        string? HeroSubtitle,
        int Level,
        double InitialPrice,
        bool Status
    );

    public record UpdateServiceRequest(
        string Name,
        string? Slug,
        long? ParentId,
        string? BannerImage,
        string? ServiceIcon,
        string? PriceUnit,
        double? Rating,
        int? ReviewCount,
        string? HeroTitle,
        string? HeroSubtitle,
        int Level,
        double InitialPrice,
        bool Status
    );
}
