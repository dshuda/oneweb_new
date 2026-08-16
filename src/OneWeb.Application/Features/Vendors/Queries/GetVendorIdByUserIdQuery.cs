using MediatR;
using OneWeb.Application.Common.Models;

namespace OneWeb.Application.Features.Vendors.Queries;

public record GetVendorIdByUserIdQuery(long UserId) : IRequest<long>;
