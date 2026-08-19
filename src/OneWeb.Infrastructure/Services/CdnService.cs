using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OneWeb.Domain.Interfaces;
using OneWeb.Domain.Storage;

namespace OneWeb.Infrastructure.Services;

/// <summary>
/// Uploads to DigitalOcean Spaces over the S3 API and serves the results from
/// the Spaces CDN edge.
///
/// Two Spaces-specific details: path-style addressing is required, and the
/// AWS SDK v4 default of adding integrity checksums has to be turned off —
/// Spaces rejects the extra checksum headers.
/// </summary>
public class CdnService : ICdnService, IDisposable
{
    private readonly CdnOptions _options;
    private readonly ILogger<CdnService> _logger;
    private readonly AmazonS3Client? _client;

    public CdnService(IOptions<CdnOptions> options, ILogger<CdnService> logger)
    {
        _options = options.Value;
        _logger = logger;

        if (!_options.IsConfigured)
        {
            _logger.LogWarning("CDN is not configured; uploads will be rejected.");
            return;
        }

        var config = new AmazonS3Config
        {
            ServiceURL = _options.Endpoint,
            ForcePathStyle = true,
            AuthenticationRegion = _options.Region,
            // Spaces rejects the checksum headers the v4 SDK adds by default.
            RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
            ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED
        };

        _client = new AmazonS3Client(
            new BasicAWSCredentials(_options.AccessKey, _options.SecretKey), config);
    }

    public bool IsEnabled => _client != null;

    public async Task<CdnUploadResult> UploadAsync(
        Stream content,
        string fileName,
        string contentType,
        string? folder = null,
        CancellationToken cancellationToken = default)
    {
        if (_client == null)
            return new CdnUploadResult(false, null, null, "CDN is not configured");

        var key = BuildKey(fileName, folder);

        try
        {
            var request = new PutObjectRequest
            {
                BucketName = _options.Bucket,
                Key = key,
                InputStream = content,
                ContentType = string.IsNullOrWhiteSpace(contentType)
                    ? "application/octet-stream"
                    : contentType,
                // Storefront imagery is public by design.
                CannedACL = S3CannedACL.PublicRead,
                DisablePayloadSigning = true
            };

            await _client.PutObjectAsync(request, cancellationToken);

            var url = BuildPublicUrl(key);
            _logger.LogInformation("Uploaded {Key} to the CDN", key);
            return new CdnUploadResult(true, key, url, "Uploaded");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CDN upload failed for {Key}", key);
            return new CdnUploadResult(false, key, null, ex.Message);
        }
    }

    public string BuildPublicUrl(string key)
    {
        var trimmed = key.TrimStart('/');

        if (!string.IsNullOrWhiteSpace(_options.CdnEndpoint))
            return $"{_options.CdnEndpoint.TrimEnd('/')}/{trimmed}";

        // No edge endpoint configured — fall back to the origin.
        return $"{_options.Endpoint.TrimEnd('/')}/{_options.Bucket}/{trimmed}";
    }

    public async Task<CdnListResult> ListAsync(
        string? folder = null,
        int maxKeys = 200,
        string? continuationToken = null,
        CancellationToken cancellationToken = default)
    {
        if (_client == null)
            return CdnListResult.Failed("CDN is not configured");

        // Always scope to the tenant root so the portal can never enumerate
        // another project's objects in the shared bucket.
        var segments = new List<string>();
        if (!string.IsNullOrWhiteSpace(_options.RootFolder)) segments.Add(_options.RootFolder.Trim('/'));
        if (!string.IsNullOrWhiteSpace(folder)) segments.Add(folder.Trim('/'));
        var prefix = string.Join('/', segments);
        if (prefix.Length > 0) prefix += "/";

        try
        {
            var response = await _client.ListObjectsV2Async(new ListObjectsV2Request
            {
                BucketName = _options.Bucket,
                Prefix = prefix,
                MaxKeys = Math.Clamp(maxKeys, 1, 1000),
                ContinuationToken = string.IsNullOrWhiteSpace(continuationToken) ? null : continuationToken
            }, cancellationToken);

            var items = response.S3Objects
                .Select(o => new CdnObject(o.Key, BuildPublicUrl(o.Key), o.Size ?? 0, o.LastModified))
                .OrderBy(o => o.Key, StringComparer.OrdinalIgnoreCase)
                .ToList();

            return new CdnListResult(
                true, items,
                response.IsTruncated == true ? response.NextContinuationToken : null,
                $"{items.Count} object(s)");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CDN list failed for prefix {Prefix}", prefix);
            return CdnListResult.Failed(ex.Message);
        }
    }

    public async Task<bool> DeleteAsync(string key, CancellationToken cancellationToken = default)
    {
        if (_client == null) return false;

        try
        {
            await _client.DeleteObjectAsync(
                new DeleteObjectRequest { BucketName = _options.Bucket, Key = key.TrimStart('/') },
                cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CDN delete failed for {Key}", key);
            return false;
        }
    }

    /// <summary>root/folder/name-8charhex.ext — the suffix avoids collisions.</summary>
    private string BuildKey(string fileName, string? folder)
    {
        var extension = Path.GetExtension(fileName);
        var stem = Path.GetFileNameWithoutExtension(fileName);
        var safeStem = Slugify(string.IsNullOrWhiteSpace(stem) ? "file" : stem);
        var unique = Guid.NewGuid().ToString("N")[..8];

        var segments = new List<string>();
        if (!string.IsNullOrWhiteSpace(_options.RootFolder)) segments.Add(_options.RootFolder.Trim('/'));
        if (!string.IsNullOrWhiteSpace(folder)) segments.Add(folder.Trim('/'));
        segments.Add($"{safeStem}-{unique}{extension}");

        return string.Join('/', segments);
    }

    private static string Slugify(string value)
    {
        var chars = value
            .ToLowerInvariant()
            .Select(c => char.IsLetterOrDigit(c) ? c : '-')
            .ToArray();

        var slug = new string(chars);
        while (slug.Contains("--", StringComparison.Ordinal))
            slug = slug.Replace("--", "-", StringComparison.Ordinal);

        return slug.Trim('-');
    }

    public void Dispose() => _client?.Dispose();
}
