using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Infrastructure.Persistence;


namespace OneWeb.Application.Features.Orders.Queries;

public class GetVendorProccessingOrdersQuery : IRequest<IEnumerable<MyProccessingOrderDTO>>
{
    public long VendorId { get; set; }
}
internal class GetVendorProccessingOrdersQueryHandler : IRequestHandler<GetVendorProccessingOrdersQuery, IEnumerable<MyProccessingOrderDTO>>
{
    private readonly AppDbContext _context;
    public GetVendorProccessingOrdersQueryHandler(AppDbContext context)
    {
        _context = context;
    }
    public async Task<IEnumerable<MyProccessingOrderDTO>> Handle(GetVendorProccessingOrdersQuery request, CancellationToken cancellationToken)
    {
        var serviceIds = await _context.VendorServices.Where(f => f.VendorId == request.VendorId).Select(f => f.ServiceId).ToArrayAsync(cancellationToken);
        var re = await _context.Orders.Include(s=>s.Service).ThenInclude(f=>f.Prices).Where(f => f.VendorId == request.VendorId).Select(s => new MyProccessingOrderDTO
        {
            Tracking = s.TrackingCode,
            OrderId = s.Id,
            Service = s.Service.Name ?? string.Empty,
            Status = s.DeliveryStatus,
            Price = s.Service.Prices
                                .Where(p => p.Id == s.PriceId)
                                .Select(p => (double?)p.Price)
                                .FirstOrDefault() ?? 0,
            Date = s.ServiceDate,
            Address = s.ShippingAddress,
            AdditionalInfo = s.AdditionalInfo,
            Time = s.Time,

        }).ToListAsync(cancellationToken);
        return re;
    }
}

public record MyProccessingOrderDTO
{
    public string? Tracking { get; set; }
    public long OrderId { get; set; }
    public string? Service { get; set; }
    public double Price { get; set; }
    public string? Status { get; set; }
    public string? Address { get; set; }
    public string? AdditionalInfo { get; set; }
    public DateOnly Date { get; set; }
    public TimeSpan? Time { get; set; }

}

