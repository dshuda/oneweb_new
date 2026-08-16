using MediatR;
using OneWeb.Application.Common.Models;

namespace OneWeb.Application.Features.Users.DTOs;

public record UserDto(
    long Id,
    string? Name,
    string? Email,
    string? Phone,
    string? UserType,
    bool Status,
    bool IsApproved,
    bool IsBanned,
    DateTime? CreatedAt
);

public record UserDetailDto(
    long Id,
    string? Name,
    string? Email,
    string? Phone,
    string? UserType,
    string? Gender,
    string? Address,
    string? ImageId,
    bool Status,
    bool IsApproved,
    bool IsBanned,
    DateTime? CreatedAt,
    DateTime? UpdatedAt
);
