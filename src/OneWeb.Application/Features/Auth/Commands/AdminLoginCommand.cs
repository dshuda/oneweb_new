using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Domain.Interfaces;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Auth.Commands;

public record AdminLoginCommand(string Email, string Password) : IRequest<AuthResult>;
