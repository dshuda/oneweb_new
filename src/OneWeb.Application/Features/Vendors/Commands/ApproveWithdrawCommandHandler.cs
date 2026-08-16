using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Vendors.Commands;

public class ApproveWithdrawCommandHandler : IRequestHandler<ApproveWithdrawCommand, bool>
{
    private readonly AppDbContext _dbContext;
    
    public ApproveWithdrawCommandHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    public async Task<bool> Handle(ApproveWithdrawCommand request, CancellationToken cancellationToken)
    {
        var withdrawRequest = await _dbContext.VendorWithdrawRequests
            .Include(r => r.Vendor)
            .FirstOrDefaultAsync(r => r.Id == request.RequestId, cancellationToken);
        
        if (withdrawRequest == null)
            return false;
        
        // Update status
        withdrawRequest.Status = request.Status;
        withdrawRequest.Note = request.Note;
        withdrawRequest.UpdatedAt = DateTime.UtcNow;
        
        // If rejected: refund balance to vendor
        if (request.Status == "rejected" && withdrawRequest.Vendor != null)
        {
            withdrawRequest.Vendor.Balance += withdrawRequest.Amount;
            withdrawRequest.Vendor.UpdatedAt = DateTime.UtcNow;
        }
        // If approved: no balance change (already deducted in CreateWithdrawRequest)
        
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
