using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Vendors.Commands;

/// <summary>
/// T1.4 — Implements the missing UpdateVendorStatusCommandHandler.
/// Admin can approve or reject vendor applications.
/// </summary>
public class UpdateVendorStatusCommandHandler : IRequestHandler<UpdateVendorStatusCommand, bool>
{
    private readonly AppDbContext _dbContext;

    public UpdateVendorStatusCommandHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> Handle(UpdateVendorStatusCommand request, CancellationToken cancellationToken)
    {
        var vendor = await _dbContext.Vendors
            .FirstOrDefaultAsync(v => v.Id == request.VendorId, cancellationToken);

        if (vendor == null)
            return false;

        vendor.Status = request.Status;
        vendor.UpdatedAt = DateTime.UtcNow;

        // Also sync User.IsApproved when approving/rejecting vendor
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == vendor.UserId, cancellationToken);

        if (user != null)
        {
            user.IsApproved = request.Status;
            user.UpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
