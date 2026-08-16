namespace OneWeb.Domain.Interfaces;

/// <summary>
/// T4.1 — Interface for invalidating the admin dashboard statistics cache.
/// Defined in the Application layer so that Command Handlers can depend on it
/// without creating a circular dependency on Infrastructure.
/// </summary>
public interface IDashboardCacheService
{
    Task InvalidateStatsAsync();
}
