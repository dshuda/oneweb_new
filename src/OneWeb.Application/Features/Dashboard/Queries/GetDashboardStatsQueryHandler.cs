using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Infrastructure.Persistence;
using System.Text.Json;

namespace OneWeb.Application.Features.Dashboard.Queries;

public class GetDashboardStatsQueryHandler : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    private readonly AppDbContext _dbContext;
    private readonly StackExchange.Redis.IDatabase _redis;

    public GetDashboardStatsQueryHandler(AppDbContext dbContext, StackExchange.Redis.IConnectionMultiplexer redis)
    {
        _dbContext = dbContext;
        _redis = redis.GetDatabase();
    }

    public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        const string cacheKey = "dashboard:stats";
        var cached = await _redis.StringGetAsync(cacheKey);
        if (!cached.IsNullOrEmpty)
        {
            return JsonSerializer.Deserialize<DashboardStatsDto>((string)cached!)!;
        }

        var today = DateTime.UtcNow.Date;

        var totalOrders = await _dbContext.Orders.CountAsync(cancellationToken);
        var pendingOrders = await _dbContext.Orders.CountAsync(o => o.DeliveryStatus == "pending", cancellationToken);
        var completedOrders = await _dbContext.Orders.CountAsync(o => o.DeliveryStatus == "completed", cancellationToken);
        var cancelledOrders = await _dbContext.Orders.CountAsync(o => o.IsCancelled == 1, cancellationToken);

        var totalUsers = await _dbContext.Users.CountAsync(u => u.UserType == "customer", cancellationToken);
        var totalVendors = await _dbContext.Vendors.CountAsync(v => v.Status, cancellationToken);

        var totalRevenue = await _dbContext.Orders
            .Where(o => o.PaymentStatus == "paid")
            .SumAsync(o => o.GrandTotal ?? 0, cancellationToken);

        var todayRevenue = await _dbContext.Orders
            .Where(o => o.PaymentStatus == "paid" && o.CreatedAt.HasValue && o.CreatedAt.Value.Date == today)
            .SumAsync(o => o.GrandTotal ?? 0, cancellationToken);

        var totalServices = await _dbContext.Services
            .CountAsync(s => s.Level == 2 && s.Status, cancellationToken);

        var recentOrders = await _dbContext.Orders
            .OrderByDescending(o => o.CreatedAt)
            .Take(10)
            .Select(o => new RecentOrderDto(
                o.Id,
                o.TrackingCode,
                o.DeliveryStatus,
                o.GrandTotal,
                o.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        var result = new DashboardStatsDto(
            totalOrders,
            pendingOrders,
            completedOrders,
            cancelledOrders,
            totalUsers,
            totalVendors,
            totalRevenue,
            todayRevenue,
            totalServices,
            recentOrders
        );

        var serialized = JsonSerializer.Serialize(result);
        await _redis.StringSetAsync(cacheKey, serialized, TimeSpan.FromMinutes(5));

        return result;
    }
}
