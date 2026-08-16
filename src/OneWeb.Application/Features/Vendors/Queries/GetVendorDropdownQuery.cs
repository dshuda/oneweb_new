using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Vendors.Queries;

public class GetVendorDropdownQuery : IRequest<IEnumerable<object>>
{
    public string? Search { get; set; }
    public long ServiceId { get; set; }
}
public class GetVendorDropdownQueryHandler : IRequestHandler<GetVendorDropdownQuery, IEnumerable<object>>
{
    private readonly AppDbContext _dbContext;

    public GetVendorDropdownQueryHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<object>> Handle(GetVendorDropdownQuery request, CancellationToken cancellationToken)
    {

        var getRoot = await _dbContext.Services.Where(f => f.Id == request.ServiceId)
            .Include(f => f.Parent).FirstOrDefaultAsync(cancellationToken);
        var rootId = getRoot?.Parent?.ParentId;
        var vendor = await _dbContext.Vendors
            .AsNoTracking()
            .Include(v => v.User)
            .Include(f=>f.VendorServices)
            .Where(f=>f.VendorServices.Any(s=>s.ServiceId == rootId))
            .Select(f => new
            {
                Id = f.UserId,
                Text = f.User.Name
            }).ToListAsync(cancellationToken);

        return vendor;
    }
}
