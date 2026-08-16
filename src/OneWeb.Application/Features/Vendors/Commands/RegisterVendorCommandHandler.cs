using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Vendors.Commands;

public record RegisterVendorCommand : IRequest<long>
{
    public long UserId { get; set; }
    public long[]? ServiceIds { get; set; }
    public string? Phone { get; set; }
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
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Phone == request.Phone, cancellationToken);
        if (user == null)
        {
            throw new Exception($"User Not Found with {request.Phone}");
        }
        if (user.UserType == "vendor")
        {
            throw new Exception($"{request.Phone} already registred as vendor");
        }

        // Create Vendor
        var vendor = new Vendor
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
            Status = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Vendors.Add(vendor);

        // T3.1 — Process Service IDs into junction table entries
        if (request.ServiceIds != null)
        {

            foreach (var sIdStr in request.ServiceIds)
            {
                _dbContext.VendorServices.Add(new VendorService
                {
                    Vendor = vendor,
                    ServiceId = sIdStr,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        user.UserType = "vendor";
        user.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return vendor.Id;
    }
}
