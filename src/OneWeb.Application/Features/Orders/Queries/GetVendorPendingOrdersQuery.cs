using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Infrastructure.Persistence;


namespace OneWeb.Application.Features.Orders.Queries;

public class GetVendorPendingOrdersQuery : IRequest<IEnumerable<PendingOrderDTO>>
{
    public long VendorId { get; set; }
}
internal class GetVendorPendingOrdersQueryHandler : IRequestHandler<GetVendorPendingOrdersQuery, IEnumerable<PendingOrderDTO>>
    {
    private readonly AppDbContext _context;
    public GetVendorPendingOrdersQueryHandler(AppDbContext context)
    {
        _context = context;
    }
    public async Task<IEnumerable<PendingOrderDTO>> Handle(GetVendorPendingOrdersQuery request, CancellationToken cancellationToken)
    {
        var serviceIds = await _context.VendorServices.Where(f => f.VendorId == request.VendorId).Select(f => f.ServiceId).ToArrayAsync(cancellationToken);
        var re = await _context.Orders.Where(f => serviceIds.Contains(f.Service.Parent.Parent.Id) && (f.VendorId == null || f.VendorId == 0)).Select(s => new PendingOrderDTO
        {
            Tracking = s.TrackingCode,
            OrderId = s.Id,
            Service = s.Service.Name ?? string.Empty,
            Price = s.Service.Prices
                                .Where(p => p.Id == s.PriceId)
                                .Select(p => (double?)p.Price)
                                .FirstOrDefault() ?? 0,
            Date = s.ServiceDate,
            Address = s.ShippingAddress,
            Time = s.Time,

        }).ToListAsync(cancellationToken);
        return re;
    }
}

public record PendingOrderDTO
{
    public string? Tracking { get; set; }
    public long OrderId { get; set; }
    public string? Service { get; set; }
    public double Price { get; set; }
    public string? Address { get; set; }
    public DateOnly Date { get; set; }
    public TimeSpan? Time { get; set; }

}

