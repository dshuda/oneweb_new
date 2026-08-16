using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Services.Queries;

public class GetRootServicesQuery : IRequest<IEnumerable<object>>
{

}
public class GetRootServicesQueryHandler : IRequestHandler<GetRootServicesQuery, IEnumerable<object>>
{
    private readonly AppDbContext _dbContext;
    
    public GetRootServicesQueryHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IEnumerable<object>> Handle(GetRootServicesQuery request, CancellationToken cancellationToken)
    {
        // Get from DB: categories (Level=0)
        var query = _dbContext.Services.Where(f=>f.Status == true)
            .Where(s => s.Level == 0);
       

        var categories = await query
            .OrderBy(s => s.Name)
            .Select(f=> new
            {
                f.Id,
                f.Name
            })
            .ToListAsync(cancellationToken);
        return categories;


    }
    
}
