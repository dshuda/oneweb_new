using System.Collections.Generic;
using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Application.Common.Models;
using OneWeb.Application.Features.Services.DTOs;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Services.Queries;

public class GetServiceHtmlContentQuery : IRequest<object>
{
    public long Id { get; set; }
}
public class GetServiceHtmlContentQueryHandler : IRequestHandler<GetServiceHtmlContentQuery, object>
{
    private readonly AppDbContext _dbContext;
    
    public GetServiceHtmlContentQueryHandler(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    public async Task<object> Handle(GetServiceHtmlContentQuery request, CancellationToken cancellationToken)
    {
        // Query services where Level=2 AND Status=true
        var query = await _dbContext.Services.AsNoTracking().Where(s => s.Id == request.Id).FirstOrDefaultAsync() ;
        if (query == null)
            return new { };

        var obj = new
        {
            About = query.About,
            FAQ = query.FAQ,
            Detail = query.Detail

        };
        return obj;
       
       
    }
}
