namespace OneWeb.Domain.Interfaces;

public interface ICdnService
{
    bool IsEnabled { get; }

    /// <summary>
    /// Upload a file and return its public CDN URL. <paramref name="folder"/> is
    /// appended to the configured root folder, e.g. "service-banners".
    /// </summary>
    Task<CdnUploadResult> UploadAsync(
        Stream content,
        string fileName,
        string contentType,
        string? folder = null,
        CancellationToken cancellationToken = default);

    /// <summary>Public CDN URL for an object key already in the bucket.</summary>
    string BuildPublicUrl(string key);

    Task<bool> DeleteAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// List objects under a folder so the portal can browse and manage what is
    /// on the CDN rather than only push to it.
    /// </summary>
    Task<CdnListResult> ListAsync(
        string? folder = null,
        int maxKeys = 200,
        string? continuationToken = null,
        CancellationToken cancellationToken = default);
}

public record CdnUploadResult(bool Success, string? Key, string? Url, string? Message);

public record CdnObject(string Key, string Url, long Size, DateTime? LastModified);

public record CdnListResult(
    bool Success,
    IReadOnlyList<CdnObject> Items,
    string? NextContinuationToken,
    string? Message)
{
    public static CdnListResult Failed(string message) =>
        new(false, Array.Empty<CdnObject>(), null, message);
}
