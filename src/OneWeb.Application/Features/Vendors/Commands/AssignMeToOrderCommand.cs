using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.Text;

namespace OneWeb.Application.Features.Vendors.Commands;

public class AssignMeToOrderCommand : IRequest
{
    public long OrderId { get; set; }
    public long VendorId { get; set; }
}

internal class AssignMeToOrderCommandHandler : IRequestHandler<AssignMeToOrderCommand>
{
    private readonly AppDbContext _context;
    public AssignMeToOrderCommandHandler(AppDbContext context)
    {
        _context = context;
    }
    public async Task Handle(AssignMeToOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders.Where(f => f.Id == request.OrderId).FirstOrDefaultAsync(cancellationToken);
        if (order == null)
        {
            throw new Exception("Order Not Found");
        }
        var rowsAffected = await _context.Orders.Where(f => f.Id == request.OrderId && f.VendorId == null).ExecuteUpdateAsync(f => f.SetProperty(s => s.VendorId, request.VendorId), cancellationToken);
        if (rowsAffected == 0)
        {
            throw new Exception("Order already assigned to someone");
        }
        }
}