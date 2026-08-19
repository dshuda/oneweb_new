namespace OneWeb.Application.Features.Vendors.DTOs;

public record VendorDto(
    long Id, 
    long UserId, 
    string? UserName, 
    string? Phone,
    double Balance, 
    double PendingBalance, 
    double CommissionRate,
    double TotalEarnings,
    string? Address,
    bool Status,
    DateTime? CreatedAt,
    // The admin edit form round-trips this list; omitting it would make a save
    // look like "assign no services" and clear the vendor's existing links.
    List<long>? ServiceIds = null
);

public record VendorEarningsDto(
    double Balance, 
    double PendingBalance, 
    double TotalEarnings,
    List<CommissionHistoryDto> RecentCommissions
);

public record CommissionHistoryDto(
    long OrderId, 
    double VendorAmount, 
    double CommissionAmount, 
    DateTime? CreatedAt
);

public record VendorWithdrawRequestDto(
    long Id,
    long VendorId,
    double Amount,
    string? PaymentMethod,
    string? AccountNumber,
    string? Status,
    string? Note,
    DateTime? CreatedAt
);
