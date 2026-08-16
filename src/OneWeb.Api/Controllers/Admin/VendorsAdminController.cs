using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Api.DTOs;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/vendors")]
[Authorize]
public class VendorsAdminController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public VendorsAdminController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetVendors(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] bool? status = null,
        [FromQuery] string? search = null)
    {
        var query = _dbContext.Vendors
            .Include(v => v.User)
            .Include(v => v.VendorServices)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(v => v.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(v =>
                (v.User != null && v.User.Name != null && v.User.Name.ToLower().Contains(s)) ||
                (v.User != null && v.User.Phone != null && v.User.Phone.ToLower().Contains(s)) ||
                (v.Address != null && v.Address.ToLower().Contains(s)));
        }

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        var vendors = await query
            .OrderByDescending(v => v.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new
            {
                id = v.Id,
                userId = v.UserId,
                userName = v.User != null ? v.User.Name : "Vendor",
                phone = v.User != null ? v.User.Phone : "",
                balance = v.Balance,
                pendingBalance = v.PendingBalance,
                totalEarnings = v.TotalEarnings,
                commissionRate = v.CommissionRate,
                address = v.Address,
                status = v.Status,
                serviceIds = v.VendorServices.Select(vs => vs.ServiceId).ToList(),
                createdAt = v.CreatedAt
            })
            .ToListAsync();

        return ApiResponseFactory.Ok(new
        {
            items = vendors,
            totalCount,
            page,
            pageSize,
            totalPages
        }, HttpContext);
    }

    [HttpGet("dropdown")]
    public async Task<IActionResult> GetVendorsDropDown([FromQuery] long? serviceId = null)
    {
        var query = _dbContext.Vendors
            .Include(v => v.User)
            .Include(v => v.VendorServices)
            .Where(v => v.Status == true)
            .AsQueryable();

        if (serviceId.HasValue && serviceId.Value > 0)
        {
            var matching = await query
                .Where(v => v.VendorServices.Any(vs => vs.ServiceId == serviceId.Value))
                .Select(v => new
                {
                    id = v.Id,
                    name = v.User != null ? v.User.Name : "Vendor",
                    userName = v.User != null ? v.User.Name : "Vendor",
                    phone = v.User != null ? v.User.Phone : "",
                    serviceIds = v.VendorServices.Select(vs => vs.ServiceId).ToList()
                })
                .ToListAsync();

            if (matching.Count > 0)
            {
                return ApiResponseFactory.Ok(matching, HttpContext);
            }
        }

        var allVendors = await query
            .Select(v => new
            {
                id = v.Id,
                name = v.User != null ? v.User.Name : "Vendor",
                userName = v.User != null ? v.User.Name : "Vendor",
                phone = v.User != null ? v.User.Phone : "",
                serviceIds = v.VendorServices.Select(vs => vs.ServiceId).ToList()
            })
            .ToListAsync();

        return ApiResponseFactory.Ok(allVendors, HttpContext);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetVendor(long id)
    {
        var vendor = await _dbContext.Vendors
            .Include(v => v.User)
            .Include(v => v.VendorServices)
            .Where(v => v.Id == id)
            .Select(v => new
            {
                id = v.Id,
                userId = v.UserId,
                userName = v.User != null ? v.User.Name : "",
                phone = v.User != null ? v.User.Phone : "",
                balance = v.Balance,
                pendingBalance = v.PendingBalance,
                totalEarnings = v.TotalEarnings,
                commissionRate = v.CommissionRate,
                address = v.Address,
                status = v.Status,
                serviceIds = v.VendorServices.Select(vs => vs.ServiceId).ToList(),
                createdAt = v.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (vendor == null)
            return NotFound(new { message = "Vendor not found." });

        return ApiResponseFactory.Ok(vendor, HttpContext);
    }

    [HttpPost]
    public async Task<IActionResult> CreateVendorAsync([FromBody] AdminVendorSaveRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Phone))
        {
            return BadRequest(new { message = "Phone number is required." });
        }

        var cleanPhone = request.Phone.Trim();
        var vendorName = !string.IsNullOrWhiteSpace(request.UserName)
            ? request.UserName.Trim()
            : (!string.IsNullOrWhiteSpace(request.Name) ? request.Name.Trim() : "Vendor");

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Phone == cleanPhone);

        if (user == null)
        {
            user = new User
            {
                Name = vendorName,
                Phone = cleanPhone,
                Email = $"vendor_{DateTime.UtcNow.Ticks}@oneweb.com",
                UserType = "vendor",
                Status = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _dbContext.Users.AddAsync(user);
            await _dbContext.SaveChangesAsync();
        }
        else
        {
            user.Name = vendorName;
            user.UserType = "vendor";
            user.UpdatedAt = DateTime.UtcNow;
        }

        var vendor = await _dbContext.Vendors
            .Include(v => v.VendorServices)
            .FirstOrDefaultAsync(v => v.UserId == user.Id);

        var isActive = request.Current ?? request.Status ?? true;

        if (vendor == null)
        {
            vendor = new Vendor
            {
                UserId = user.Id,
                CommissionRate = request.CommissionRate,
                Status = isActive,
                Address = request.Address,
                ShortBiography = request.ShortBiography,
                Nid = request.Nid,
                TradeLicense = request.TradeLicense,
                BankName = request.BankName,
                BankAccountName = request.BankAccountName,
                BankAccountNumber = request.BankAccountNumber,
                BankRoutingNumber = request.BankRoutingNumber,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _dbContext.Vendors.AddAsync(vendor);
            await _dbContext.SaveChangesAsync();
        }
        else
        {
            vendor.CommissionRate = request.CommissionRate;
            vendor.Status = isActive;
            if (!string.IsNullOrWhiteSpace(request.Address)) vendor.Address = request.Address;
            vendor.UpdatedAt = DateTime.UtcNow;
        }

        // Sync VendorServices
        if (request.ServiceIds != null)
        {
            var existing = _dbContext.VendorServices.Where(vs => vs.VendorId == vendor.Id);
            _dbContext.VendorServices.RemoveRange(existing);
            foreach (var sid in request.ServiceIds.Distinct())
            {
                await _dbContext.VendorServices.AddAsync(new VendorService
                {
                    VendorId = vendor.Id,
                    ServiceId = sid,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        await _dbContext.SaveChangesAsync();

        return ApiResponseFactory.Ok(new
        {
            message = "Vendor created successfully.",
            vendorId = vendor.Id
        }, HttpContext);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateVendorAsync(long id, [FromBody] AdminVendorSaveRequest request)
    {
        var vendor = await _dbContext.Vendors
            .Include(v => v.User)
            .Include(v => v.VendorServices)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vendor == null)
        {
            return NotFound(new { message = "Vendor not found." });
        }

        if (vendor.User != null)
        {
            if (!string.IsNullOrWhiteSpace(request.UserName)) vendor.User.Name = request.UserName.Trim();
            else if (!string.IsNullOrWhiteSpace(request.Name)) vendor.User.Name = request.Name.Trim();
            if (!string.IsNullOrWhiteSpace(request.Phone)) vendor.User.Phone = request.Phone.Trim();
            vendor.User.UpdatedAt = DateTime.UtcNow;
        }

        vendor.CommissionRate = request.CommissionRate;
        if (request.Current.HasValue) vendor.Status = request.Current.Value;
        else if (request.Status.HasValue) vendor.Status = request.Status.Value;

        if (request.Address != null) vendor.Address = request.Address;
        if (request.ShortBiography != null) vendor.ShortBiography = request.ShortBiography;
        if (request.Nid != null) vendor.Nid = request.Nid;
        if (request.TradeLicense != null) vendor.TradeLicense = request.TradeLicense;
        if (request.BankName != null) vendor.BankName = request.BankName;
        if (request.BankAccountName != null) vendor.BankAccountName = request.BankAccountName;
        if (request.BankAccountNumber != null) vendor.BankAccountNumber = request.BankAccountNumber;
        if (request.BankRoutingNumber != null) vendor.BankRoutingNumber = request.BankRoutingNumber;
        vendor.UpdatedAt = DateTime.UtcNow;

        // Sync VendorServices
        if (request.ServiceIds != null)
        {
            var existing = _dbContext.VendorServices.Where(vs => vs.VendorId == vendor.Id);
            _dbContext.VendorServices.RemoveRange(existing);
            foreach (var sid in request.ServiceIds.Distinct())
            {
                await _dbContext.VendorServices.AddAsync(new VendorService
                {
                    VendorId = vendor.Id,
                    ServiceId = sid,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        await _dbContext.SaveChangesAsync();

        return ApiResponseFactory.Ok(new
        {
            message = "Vendor updated successfully."
        }, HttpContext);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateVendorStatusRequest request)
    {
        var vendor = await _dbContext.Vendors.FindAsync(id);
        if (vendor == null)
            return NotFound(new { message = "Vendor not found." });

        if (request.IsBanned.HasValue)
        {
            vendor.Status = !request.IsBanned.Value;
        }
        else if (request.IsActive.HasValue)
        {
            vendor.Status = request.IsActive.Value;
        }
        else if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var st = request.Status.Trim().ToLower();
            vendor.Status = (st == "active" || st == "true");
        }

        vendor.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return ApiResponseFactory.Ok(new
        {
            message = "Vendor status updated successfully.",
            status = vendor.Status
        }, HttpContext);
    }

    [HttpGet("{id}/withdraw-requests")]
    public async Task<IActionResult> GetWithdrawRequests(long id)
    {
        var requests = await _dbContext.VendorWithdrawRequests
            .Where(r => r.VendorId == id)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return ApiResponseFactory.Ok(requests, HttpContext);
    }

    [HttpPut("withdraw-requests/{id}/approve")]
    public async Task<IActionResult> ApproveWithdrawRequest(long id, [FromBody] ApproveWithdrawRequestDto request)
    {
        var withdraw = await _dbContext.VendorWithdrawRequests.FindAsync(id);
        if (withdraw == null)
            return NotFound(new { message = "Withdraw request not found." });

        withdraw.Status = request.Status;
        withdraw.Note = request.Note;
        withdraw.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return ApiResponseFactory.Ok(new { message = "Withdraw request updated successfully." }, HttpContext);
    }
}

public class AdminVendorSaveRequest
{
    public string? UserName { get; set; }
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public double CommissionRate { get; set; } = 0;
    public bool? Current { get; set; }
    public bool? Status { get; set; }
    public List<long>? ServiceIds { get; set; }
    public string? Address { get; set; }
    public string? ShortBiography { get; set; }
    public string? Nid { get; set; }
    public string? TradeLicense { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountName { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankRoutingNumber { get; set; }
}

public class UpdateVendorStatusRequest
{
    public string? Status { get; set; }
    public bool? IsBanned { get; set; }
    public bool? IsActive { get; set; }
}

public class ApproveWithdrawRequestDto
{
    public string Status { get; set; } = "approved";
    public string? Note { get; set; }
}
