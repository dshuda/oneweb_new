using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Vendors.Commands;

public record RegisterVendorCommand : IRequest<long>
{
    public long UserId { get; set; }
    public string? UserName { get; set; }
    public string? Name { get; set; }
    public long[]? ServiceIds { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? BankName { get; set; }
    public double CommissionRate { get; set; } = 0;
    public string? BankAccountName { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankRoutingNumber { get; set; }
    public int? Division { get; set; }
    public int? District { get; set; }
    public string? Address { get; set; }
    public string? ShortBiography { get; set; }
    public string? Nid { get; set; }
    public string? TradeLicense { get; set; }
    public bool Status { get; set; } = true;
}
public class RegisterVendorCommandHandler : IRequestHandler<RegisterVendorCommand, long>
{
    private readonly AppDbContext _dbContext;

    public RegisterVendorCommandHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<long> Handle(RegisterVendorCommand request, CancellationToken cancellationToken)
    {
        var cleanPhone = request.Phone?.Trim() ?? string.Empty;
        var vendorName = !string.IsNullOrWhiteSpace(request.UserName)
            ? request.UserName.Trim()
            : (!string.IsNullOrWhiteSpace(request.Name) ? request.Name.Trim() : "Vendor");

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Phone == cleanPhone, cancellationToken);
        if (user == null)
        {
            user = new User
            {
                Phone = cleanPhone,
                Name = vendorName,
                Email = !string.IsNullOrWhiteSpace(request.Email) ? request.Email : $"{cleanPhone}@vendor.oneweb.com",
                UserType = "vendor",
                Status = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        else
        {
            user.Name = vendorName;
            user.UserType = "vendor";
            user.UpdatedAt = DateTime.UtcNow;
        }

        // Check if vendor record already exists for this user
        var vendor = await _dbContext.Vendors
            .Include(f => f.VendorServices)
            .FirstOrDefaultAsync(v => v.UserId == user.Id, cancellationToken);

        if (vendor == null)
        {
            vendor = new Vendor
            {
                UserId = user.Id,
                BankName = request.BankName,
                BankAccountName = request.BankAccountName,
                BankAccountNumber = request.BankAccountNumber,
                BankRoutingNumber = request.BankRoutingNumber,
                Division = request.Division,
                CommissionRate = request.CommissionRate,
                District = request.District,
                Address = request.Address,
                ShortBiography = request.ShortBiography,
                Nid = request.Nid,
                TradeLicense = request.TradeLicense,
                Status = request.Status,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _dbContext.Vendors.Add(vendor);
        }
        else
        {
            vendor.CommissionRate = request.CommissionRate;
            vendor.Status = request.Status;
            vendor.Address = request.Address ?? vendor.Address;
            vendor.UpdatedAt = DateTime.UtcNow;
        }

        // Process Service IDs
        if (request.ServiceIds != null)
        {
            var currentServices = _dbContext.VendorServices.Where(vs => vs.VendorId == vendor.Id);
            _dbContext.VendorServices.RemoveRange(currentServices);

            foreach (var sId in request.ServiceIds)
            {
                _dbContext.VendorServices.Add(new VendorService
                {
                    Vendor = vendor,
                    ServiceId = sId,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return vendor.Id;
    }
}
