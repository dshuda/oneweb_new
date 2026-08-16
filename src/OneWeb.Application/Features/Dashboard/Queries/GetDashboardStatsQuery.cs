using MediatR;
using OneWeb.Application.Common.Models;

namespace OneWeb.Application.Features.Dashboard.Queries;

public record DashboardStatsDto(
    int TotalOrders,
    int PendingOrders,
    int CompletedOrders,
    int CancelledOrders,
    int TotalUsers,
    int TotalVendors,
    double TotalRevenue,
    double TodayRevenue,
    int TotalServices,
    List<RecentOrderDto> RecentOrders
);

public record RecentOrderDto(
    long Id,
    string? TrackingCode,
    string DeliveryStatus,
    double? GrandTotal,
    DateTime? CreatedAt
);

public record GetDashboardStatsQuery() : IRequest<DashboardStatsDto>;
