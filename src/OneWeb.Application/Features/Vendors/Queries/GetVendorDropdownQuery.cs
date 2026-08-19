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
        long? serviceId = request.ServiceId;
        long? parentId = null;
        long? grandParentId = null;

        if (serviceId.HasValue && serviceId.Value > 0)
        {
            var s = await _dbContext.Services
                .Include(f => f.Parent)
                .ThenInclude(p => p!.Parent)
                .FirstOrDefaultAsync(f => f.Id == serviceId.Value, cancellationToken);

            parentId = s?.ParentId;
            grandParentId = s?.Parent?.ParentId;
        }

        var query = _dbContext.Vendors
            .AsNoTracking()
            .Include(v => v.User)
            .Include(f => f.VendorServices)
            .Where(f => f.Status && f.User.Status);

        if (serviceId.HasValue && serviceId.Value > 0)
        {
            var matching = await query
                .Where(f => f.VendorServices.Any(vs =>
                    vs.ServiceId == serviceId.Value ||
                    (parentId.HasValue && vs.ServiceId == parentId.Value) ||
                    (grandParentId.HasValue && vs.ServiceId == grandParentId.Value)))
                .Select(f => new
                {
                    Id = f.UserId,
                    Name = f.User.Name,
                    UserName = f.User.Name,
                    Text = f.User.Name,
                    Phone = f.User.Phone,
                    Email = f.User.Email
                })
                .ToListAsync(cancellationToken);

            if (matching.Count > 0)
                return matching;
        }

        // Fallback: return all active vendors so admin can assign any available vendor
        return await query
            .Select(f => new
            {
                Id = f.UserId,
                Name = f.User.Name,
                UserName = f.User.Name,
                Text = f.User.Name,
                Phone = f.User.Phone,
                Email = f.User.Email
            })
            .ToListAsync(cancellationToken);
    }
}
