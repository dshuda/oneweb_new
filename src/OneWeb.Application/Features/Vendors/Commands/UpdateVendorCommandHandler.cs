using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Vendors.Commands;

public record UpdateVendorCommand : IRequest<long>
{
    public long Id { get; set; }
    public long[]? ServiceIds { get; set; }
    public double CommissionRate { get; set; } = 0;
    public string? Type { get; set; }
    public bool Current { get; set; }
    public int? CashPaymentStatus { get; set; }
    public bool MobilePaymentStatus { get; set; } 
    public int? BankPaymentStatus { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountName { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankRoutingNumber { get; set; }
    public long? Division { get; set; }
    public long? District { get; set; }
    public string? Address { get; set; }
    public string? ShortBiography { get; set; }
    public string? Cv { get; set; }
    public string? Nid { get; set; }
    public string? TinNumber { get; set; }
    public string? BinNumber { get; set; }
    public string? TradeLicense { get; set; }
    public string? AcademicCertificate { get; set; }
    public string? WorkExperience { get; set; }
    public bool Status { get; set; } 
}
public class UpdateVendorCommandHandler : IRequestHandler<UpdateVendorCommand, long>
{
    private readonly AppDbContext _dbContext;

    public UpdateVendorCommandHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<long> Handle(UpdateVendorCommand request, CancellationToken cancellationToken)
    {
        // Check if vendor already exists for userId
        var vendor = await _dbContext.Vendors
            .Include(f => f.VendorServices)
            .FirstOrDefaultAsync(v => v.Id == request.Id, cancellationToken);

        if (vendor == null)
            return 0;

        // Update Vendor
        vendor.BankName = request.BankName;
        vendor.BankAccountName = request.BankAccountName;
        vendor.BankAccountNumber = request.BankAccountNumber;
        vendor.BankRoutingNumber = request.BankRoutingNumber;
        vendor.Division = request.Division;
        vendor.District = request.District;
        vendor.Address = request.Address;
        vendor.ShortBiography = request.ShortBiography;
        vendor.WorkExperience = request.WorkExperience;
        
        vendor.Nid = request.Nid;
        vendor.TradeLicense = request.TradeLicense;
        vendor.Status = true;
        vendor.CommissionRate = request.CommissionRate;
        vendor.UpdatedAt = DateTime.UtcNow;

        _dbContext.Entry(vendor).State = EntityState.Modified;

        // T3.1 — Process Service IDs into junction table entries
        var requestedServiceIds = request.ServiceIds?.ToHashSet() ?? new HashSet<long>();

        // Remove services that are no longer selected
        var servicesToRemove = vendor.VendorServices
            .Where(vs => !requestedServiceIds.Contains(vs.ServiceId))
            .ToList();

        _dbContext.VendorServices.RemoveRange(servicesToRemove);

        // Add newly selected services
        var existingServiceIds = vendor.VendorServices
            .Select(vs => vs.ServiceId)
            .ToHashSet();

        var servicesToAdd = requestedServiceIds
            .Except(existingServiceIds)
            .Select(serviceId => new VendorService
            {
                VendorId = vendor.Id,
                ServiceId = serviceId,
                CreatedAt = DateTime.UtcNow
            });

        await _dbContext.VendorServices.AddRangeAsync(servicesToAdd, cancellationToken);


        await _dbContext.SaveChangesAsync(cancellationToken);
        return vendor.Id;
    }
}
