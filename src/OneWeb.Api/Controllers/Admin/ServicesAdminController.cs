using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Api.DTOs;
using OneWeb.Application.Features.Services.Commands;
using OneWeb.Application.Features.Services.Queries;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/services")]
[AllowAnonymous]
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
    [HttpPost("{id}")]
    [HttpPatch("{id}")]
    public async Task<IActionResult> UpdateService(long id, [FromBody] UpdateServiceRequest request)
    {
        var result = await _mediator.Send(new UpdateServiceCommand
        {
            Id = id,
            Name = request.Name ?? string.Empty,
            Slug = request.Slug,
            ServiceIcon = request.ServiceIcon,
            BannerImage = request.BannerImage,
            HeroTitle = request.HeroTitle,
            HeroSubtitle = request.HeroSubtitle,
            ParentId = request.ParentId,
            Level = request.Level ?? 1,
            InitialPrice = request.InitialPrice ?? 0,
            Status = request.Status ?? true
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
            ServiceIcon = request.ServiceIcon,
            BannerImage = request.BannerImage,
            HeroTitle = request.HeroTitle,
            HeroSubtitle = request.HeroSubtitle,
            ParentId = request.ParentId,
            Level = request.Level,
            InitialPrice = request.InitialPrice,
            Status = request.Status
        });
        return ApiResponseFactory.Created(result, HttpContext, "");
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

    [HttpGet("{serviceId}/schedules")]
    public async Task<IActionResult> GetSchedules(long serviceId, [FromServices] AppDbContext dbContext)
    {
        var schedules = await dbContext.ServiceSchedules
            .Where(s => s.ServiceId == serviceId)
            .OrderBy(s => s.Id)
            .Select(s => new
            {
                id = s.Id,
                serviceId = s.ServiceId,
                day = s.Day,
                startTime = s.StartTime,
                endTime = s.EndTime,
                status = s.Status
            })
            .ToListAsync();

        return ApiResponseFactory.Ok(schedules, HttpContext);
    }

    [HttpPost("{serviceId}/schedules")]
    public async Task<IActionResult> CreateSchedule(long serviceId, [FromBody] ServiceScheduleRequest request, [FromServices] AppDbContext dbContext)
    {
        var schedule = new OneWeb.Domain.Entities.ServiceSchedule
        {
            ServiceId = serviceId,
            Day = request.Day,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Status = request.Status,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.ServiceSchedules.Add(schedule);
        await dbContext.SaveChangesAsync();

        return ApiResponseFactory.Ok(new { id = schedule.Id, message = "Slot added." }, HttpContext);
    }

    [HttpPut("schedules/{id}")]
    public async Task<IActionResult> UpdateSchedule(long id, [FromBody] ServiceScheduleRequest request, [FromServices] AppDbContext dbContext)
    {
        var schedule = await dbContext.ServiceSchedules.FindAsync(id);
        if (schedule == null)
            return NotFound();

        schedule.Day = request.Day;
        schedule.StartTime = request.StartTime;
        schedule.EndTime = request.EndTime;
        schedule.Status = request.Status;
        schedule.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        return ApiResponseFactory.Ok(new { id = schedule.Id, message = "Slot updated." }, HttpContext);
    }

    [HttpDelete("schedules/{id}")]
    public async Task<IActionResult> DeleteSchedule(long id, [FromServices] AppDbContext dbContext)
    {
        var schedule = await dbContext.ServiceSchedules.FindAsync(id);
        if (schedule == null)
            return NotFound();

        dbContext.ServiceSchedules.Remove(schedule);
        await dbContext.SaveChangesAsync();

        return ApiResponseFactory.Ok(new { message = "Slot removed." }, HttpContext);
    }

    public record ServiceScheduleRequest
    {
        public string? Day { get; set; }
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public bool Status { get; set; } = true;
    }

    public record CreateServiceRequest(
        string Name,
        string? Slug,
        string? ServiceIcon,
        string? BannerImage,
        string? HeroTitle,
        string? HeroSubtitle,
        long? ParentId,
        int Level,
        double InitialPrice,
        bool Status
    );

    public record UpdateServiceRequest(
        string? Name,
        string? Slug,
        string? ServiceIcon,
        string? BannerImage,
        string? HeroTitle,
        string? HeroSubtitle,
        long? ParentId,
        int? Level,
        double? InitialPrice,
        bool? Status
    );
}
