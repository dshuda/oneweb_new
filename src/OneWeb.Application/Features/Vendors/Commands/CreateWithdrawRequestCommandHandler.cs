using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Vendors.Commands;

public class CreateWithdrawRequestCommandHandler : IRequestHandler<CreateWithdrawRequestCommand, long>
{
    private readonly AppDbContext _dbContext;
    
    public CreateWithdrawRequestCommandHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    public async Task<long> Handle(CreateWithdrawRequestCommand request, CancellationToken cancellationToken)
    {
        // Find vendor
        var vendor = await _dbContext.Vendors
            .FirstOrDefaultAsync(v => v.Id == request.VendorId, cancellationToken);
        
        if (vendor == null)
            return 0;
        
        // Validate: vendor.Balance >= Amount
        if (vendor.Balance < request.Amount)
            return 0;
        
        // Validate: Amount >= 500 (minimum withdrawal)
        if (request.Amount < 500)
            return 0;
        
        // Create WithdrawRequest
        var withdrawRequest = new VendorWithdrawRequest
        {
            VendorId = (int)vendor.Id,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod,
            AccountNumber = request.AccountNumber,
            Status = "pending",
            Note = "",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        _dbContext.VendorWithdrawRequests.Add(withdrawRequest);
        
        // Deduct from vendor.Balance
        vendor.Balance -= request.Amount;
        vendor.UpdatedAt = DateTime.UtcNow;
        
        await _dbContext.SaveChangesAsync(cancellationToken);
        
        return withdrawRequest.Id;
    }
}
