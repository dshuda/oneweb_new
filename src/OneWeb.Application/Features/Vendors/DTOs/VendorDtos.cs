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
    DateTime? CreatedAt
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
