using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Infrastructure.Persistence;
using System.ComponentModel.DataAnnotations;

namespace OneWeb.Application.Features.Auth.Commands;

public class UpdateNameCommand : IRequest
{
    [Required, StringLength(125, MinimumLength = 3)]
    public string? Name { get; set; }
    public long UserId { get; set; }
}
public class UpdateNameCommandHandler : IRequestHandler<UpdateNameCommand>
{
    private readonly AppDbContext _context;
    public UpdateNameCommandHandler(AppDbContext appDbContext)
    {
        _context = appDbContext;
    }
    public async Task Handle(UpdateNameCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        user.Name = request.Name;
        _context.Entry(user).State = EntityState.Modified;
        await _context.SaveChangesAsync(cancellationToken);

    }
}