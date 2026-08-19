using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api.Controllers;

/// <summary>
/// Availability windows for a bookable service — the day/time slots a customer
/// can pick at checkout. The entity already existed but had no controller, so
/// this ports the Laravel <c>service_schedules</c> endpoint and adds the admin
/// CRUD needed to actually maintain the slots.
/// </summary>
[ApiController]
[Route("api/v1")]
public class ServiceSchedulesController : ControllerBase
{
    private static readonly string[] Days =
        ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    private readonly AppDbContext _dbContext;

    public ServiceSchedulesController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Public: the booking flow asks what slots a service offers.
    [HttpGet("services/{serviceId:long}/schedules")]
    public async Task<IActionResult> GetSchedules(long serviceId)
    {
        var schedules = await _dbContext.ServiceSchedules
            .Where(s => s.ServiceId == serviceId && s.Status)
            .Select(s => new { s.Id, s.ServiceId, s.Day, s.StartTime, s.EndTime })
            .ToListAsync();

        // Order by the week as it runs locally, not alphabetically.
        var ordered = schedules
            .OrderBy(s => Array.IndexOf(Days, s.Day ?? string.Empty))
            .ThenBy(s => s.StartTime)
            .ToList();

        return Ok(ordered);
    }

    // Admin: includes disabled rows so they can be re-enabled.
    [HttpGet("admin/services/{serviceId:long}/schedules")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> GetAllSchedules(long serviceId)
    {
        var schedules = await _dbContext.ServiceSchedules
            .Where(s => s.ServiceId == serviceId)
            .Select(s => new { s.Id, s.ServiceId, s.Day, s.StartTime, s.EndTime, s.Status })
            .ToListAsync();

        var ordered = schedules
            .OrderBy(s => Array.IndexOf(Days, s.Day ?? string.Empty))
            .ThenBy(s => s.StartTime)
            .ToList();

        return Ok(ordered);
    }

    [HttpPost("admin/services/{serviceId:long}/schedules")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> CreateSchedule(long serviceId, [FromBody] SaveScheduleRequest request)
    {
        if (!await _dbContext.Services.AnyAsync(s => s.Id == serviceId))
            return NotFound(new { message = "Service not found" });

        if (!Days.Contains(request.Day))
            return BadRequest(new { message = "Day must be a full weekday name, e.g. Monday" });

        if (string.Compare(request.EndTime, request.StartTime, StringComparison.Ordinal) <= 0)
            return BadRequest(new { message = "The end time must be after the start time" });

        var schedule = new ServiceSchedule
        {
            ServiceId = serviceId,
            Day = request.Day,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Status = request.Status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _dbContext.ServiceSchedules.Add(schedule);
        await _dbContext.SaveChangesAsync();

        return Created($"/api/v1/services/{serviceId}/schedules", new { schedule.Id });
    }

    [HttpPut("admin/services/schedules/{id:long}")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> UpdateSchedule(long id, [FromBody] SaveScheduleRequest request)
    {
        var schedule = await _dbContext.ServiceSchedules.FirstOrDefaultAsync(s => s.Id == id);
        if (schedule == null)
            return NotFound();

        if (!Days.Contains(request.Day))
            return BadRequest(new { message = "Day must be a full weekday name, e.g. Monday" });

        if (string.Compare(request.EndTime, request.StartTime, StringComparison.Ordinal) <= 0)
            return BadRequest(new { message = "The end time must be after the start time" });

        schedule.Day = request.Day;
        schedule.StartTime = request.StartTime;
        schedule.EndTime = request.EndTime;
        schedule.Status = request.Status;
        schedule.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return Ok(new { message = "Schedule updated" });
    }

    [HttpDelete("admin/services/schedules/{id:long}")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> DeleteSchedule(long id)
    {
        var schedule = await _dbContext.ServiceSchedules.FirstOrDefaultAsync(s => s.Id == id);
        if (schedule == null)
            return NotFound();

        _dbContext.ServiceSchedules.Remove(schedule);
        await _dbContext.SaveChangesAsync();
        return Ok(new { message = "Schedule deleted" });
    }

    public record SaveScheduleRequest(string Day, string StartTime, string EndTime, bool Status);
}
