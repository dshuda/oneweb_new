using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Entities;
using OneWeb.Domain.Interfaces;
using OneWeb.Domain.Payments;
using OneWeb.Infrastructure.Persistence;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Text.Json;

namespace OneWeb.Api.Controllers;

/// <summary>
/// SSLCommerz hosted checkout.
///
/// Flow: the customer POSTs /initiate, is redirected to GatewayPageURL, pays,
/// and SSLCommerz then (a) bounces the browser back to success/fail/cancel and
/// (b) POSTs a signed IPN server-to-server. Only the IPN — or an explicit
/// server-side validation call — is trusted to mark an order paid; the browser
/// return is treated purely as navigation.
/// </summary>
[ApiController]
[Route("api/v1/payments/sslcommerz")]
public class SslCommerzController : ControllerBase
{
    private const string ReturnUrlCookie = "onetap.pay.return";

    private readonly ISslCommerzService _sslCommerz;
    private readonly AppDbContext _dbContext;
    private readonly SslCommerzOptions _options;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SslCommerzController> _logger;

    public SslCommerzController(
        ISslCommerzService sslCommerz,
        AppDbContext dbContext,
        IOptions<SslCommerzOptions> options,
        IConfiguration configuration,
        ILogger<SslCommerzController> logger)
    {
        _sslCommerz = sslCommerz;
        _dbContext = dbContext;
        _options = options.Value;
        _configuration = configuration;
        _logger = logger;
    }

    /// <param name="ReturnUrl">
    /// Where to send the customer afterwards. The storefront owns its own
    /// routing, so it passes this in; it must sit on an allowed origin.
    /// </param>
    public record InitiateRequest(long OrderId, string? ReturnUrl);

    /// <summary>Open a checkout session for one of the caller's own orders.</summary>
    [HttpPost("initiate")]
    [Authorize(Roles = "customer")]
    public async Task<IActionResult> Initiate([FromBody] InitiateRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null)
            return BadRequest(new { message = "Invalid token" });

        var userId = long.Parse(userIdClaim.Value);

        var order = await _dbContext.Orders
            .Include(o => o.User)
            .Include(o => o.Service)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId && o.UserId == userId, cancellationToken);

        if (order == null)
            return NotFound(new { message = "Order not found" });

        if (string.Equals(order.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "This order is already paid" });

        var amount = order.GrandTotal ?? 0;
        if (amount <= 0)
            return BadRequest(new { message = "Order has no payable amount" });

        // Fresh tran_id per attempt so retries don't collide at the gateway.
        var transactionId = $"OW{order.Id}-{Guid.NewGuid().ToString("N")[..10].ToUpperInvariant()}";

        var session = await _sslCommerz.InitiateSessionAsync(new SslCommerzSessionRequest(
            TransactionId: transactionId,
            Amount: amount,
            CustomerName: order.User?.Name ?? "OneTap Customer",
            CustomerPhone: order.User?.Phone ?? string.Empty,
            CustomerEmail: order.User?.Email,
            CustomerAddress: order.ShippingAddress,
            CustomerCity: null,
            CustomerPostcode: null,
            ProductName: order.Service?.Name ?? "Service booking",
            ProductCategory: "Service",
            OrderId: order.Id,
            UserId: userId,
            CallbackBaseUrl: $"{Request.Scheme}://{Request.Host}"), cancellationToken);

        if (!session.Success)
            return BadRequest(new { message = session.Message ?? "Could not start the payment session" });

        // SSLCommerz returns the browser to this API, not to the storefront, so
        // remember where to forward the customer on the way back.
        var returnUrl = ResolveReturnUrl(request.ReturnUrl);
        if (!string.IsNullOrWhiteSpace(returnUrl))
        {
            Response.Cookies.Append(ReturnUrlCookie, returnUrl, new CookieOptions
            {
                HttpOnly = true,
                SameSite = SameSiteMode.Lax,
                Secure = Request.IsHttps,
                MaxAge = TimeSpan.FromHours(1)
            });
        }

        // Order↔Payment is one-to-one (EF puts a unique index on payment.order_id),
        // so a retry updates the existing row rather than inserting another.
        var payment = await _dbContext.Payments
            .FirstOrDefaultAsync(p => p.OrderId == order.Id, cancellationToken);

        if (payment == null)
        {
            payment = new Payment
            {
                OrderId = order.Id,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.Payments.Add(payment);
        }

        payment.Amount = amount;
        payment.PaymentMethod = "sslcommerz";
        payment.TransactionId = transactionId;
        payment.Status = "pending";
        payment.UpdatedAt = DateTime.UtcNow;

        order.PaymentType = "sslcommerz";
        order.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            success = true,
            gatewayPageUrl = session.GatewayPageUrl,
            sessionKey = session.SessionKey,
            transactionId
        });
    }

    /// <summary>
    /// Server-to-server IPN. Signature is verified first, then the payment is
    /// re-validated against SSLCommerz before anything is marked paid.
    /// </summary>
    [HttpPost("ipn")]
    [AllowAnonymous]
    public async Task<IActionResult> Ipn(CancellationToken cancellationToken)
    {
        if (!Request.HasFormContentType)
            return BadRequest(new { message = "Expected a form-encoded IPN payload" });

        var form = (await Request.ReadFormAsync(cancellationToken))
            .ToDictionary(entry => entry.Key, entry => entry.Value.ToString(), StringComparer.OrdinalIgnoreCase);

        if (!_sslCommerz.VerifyIpnSignature(form))
        {
            _logger.LogWarning("Rejected SSLCommerz IPN with a bad signature for tran {TranId}", Field(form, "tran_id"));
            return Unauthorized(new { message = "Invalid IPN signature" });
        }

        var validationId = Field(form, "val_id");
        var transactionId = Field(form, "tran_id");

        // Never trust the posted status — ask SSLCommerz directly.
        var validation = !string.IsNullOrWhiteSpace(validationId)
            ? await _sslCommerz.ValidatePaymentAsync(validationId!, cancellationToken)
            : await _sslCommerz.QueryTransactionAsync(transactionId, Field(form, "sessionkey"), cancellationToken);

        var settled = await SettleAsync(form, validation, cancellationToken);
        if (!settled)
            return BadRequest(new { message = "Could not reconcile the IPN with an order" });

        return Ok(new { message = "IPN processed" });
    }

    [HttpPost("success")]
    [HttpGet("success")]
    [AllowAnonymous]
    public async Task<IActionResult> Success(CancellationToken cancellationToken)
    {
        // The browser return is not authoritative, but validating here means the
        // customer sees the right state even if the IPN is slow.
        var form = await ReadCallbackFieldsAsync(cancellationToken);
        var validationId = Field(form, "val_id");

        if (!string.IsNullOrWhiteSpace(validationId))
        {
            var validation = await _sslCommerz.ValidatePaymentAsync(validationId!, cancellationToken);
            await SettleAsync(form, validation, cancellationToken);
        }

        return RedirectToFrontend("success", Field(form, "tran_id"));
    }

    [HttpPost("fail")]
    [HttpGet("fail")]
    [AllowAnonymous]
    public async Task<IActionResult> Fail(CancellationToken cancellationToken)
    {
        var form = await ReadCallbackFieldsAsync(cancellationToken);
        await MarkAttemptAsync(Field(form, "tran_id"), "failed", cancellationToken);
        return RedirectToFrontend("failed", Field(form, "tran_id"));
    }

    [HttpPost("cancel")]
    [HttpGet("cancel")]
    [AllowAnonymous]
    public async Task<IActionResult> Cancel(CancellationToken cancellationToken)
    {
        var form = await ReadCallbackFieldsAsync(cancellationToken);
        await MarkAttemptAsync(Field(form, "tran_id"), "cancelled", cancellationToken);
        return RedirectToFrontend("cancelled", Field(form, "tran_id"));
    }

    /* -------------------------------------------------------------- helpers -- */

    private async Task<Dictionary<string, string>> ReadCallbackFieldsAsync(CancellationToken cancellationToken)
    {
        var fields = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var entry in Request.Query)
            fields[entry.Key] = entry.Value.ToString();

        if (Request.HasFormContentType)
        {
            foreach (var entry in await Request.ReadFormAsync(cancellationToken))
                fields[entry.Key] = entry.Value.ToString();
        }

        return fields;
    }

    /// <summary>
    /// Apply a validated result to the order + payment rows. Idempotent: a
    /// replayed IPN for an already-paid order is a no-op.
    /// </summary>
    private async Task<bool> SettleAsync(
        Dictionary<string, string> form,
        SslCommerzValidationResult validation,
        CancellationToken cancellationToken)
    {
        var orderId = ResolveOrderId(form, validation);
        if (orderId == null)
        {
            _logger.LogWarning("SSLCommerz callback carried no resolvable order id (tran {TranId})", Field(form, "tran_id"));
            return false;
        }

        var order = await _dbContext.Orders.FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order == null)
        {
            _logger.LogWarning("SSLCommerz callback referenced unknown order {OrderId}", orderId);
            return false;
        }

        var transactionId = validation.TransactionId ?? Field(form, "tran_id");
        var payment = await _dbContext.Payments
            .FirstOrDefaultAsync(p => p.OrderId == order.Id, cancellationToken);

        if (validation.IsPaid)
        {
            // Guard against a tampered amount: the gateway must have taken at
            // least what we asked for.
            var expected = order.GrandTotal ?? 0;
            if (validation.Amount is { } paid && paid + 0.01 < expected)
            {
                _logger.LogError(
                    "SSLCommerz amount mismatch on order {OrderId}: expected {Expected} got {Paid}",
                    order.Id, expected, paid);
                if (payment != null) payment.Status = "failed";
                await _dbContext.SaveChangesAsync(cancellationToken);
                return false;
            }

            if (!string.Equals(order.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
            {
                order.PaymentStatus = "paid";
                order.PaymentType = "sslcommerz";
                order.PaymentDetails = JsonSerializer.Serialize(new
                {
                    provider = "sslcommerz",
                    status = validation.Status,
                    tranId = validation.TransactionId,
                    valId = validation.ValidationId,
                    bankTranId = validation.BankTransactionId,
                    amount = validation.Amount,
                    currency = validation.Currency,
                    cardType = validation.CardType,
                    cardIssuer = validation.CardIssuer,
                    riskLevel = validation.RiskLevel,
                    settledAt = DateTime.UtcNow
                });
                order.UpdatedAt = DateTime.UtcNow;
            }

            if (payment != null)
            {
                payment.Status = "completed";
                payment.TransactionId = transactionId ?? payment.TransactionId;
                payment.Amount = validation.Amount ?? payment.Amount;
                payment.UpdatedAt = DateTime.UtcNow;
            }
        }
        else if (payment != null && !string.Equals(payment.Status, "completed", StringComparison.OrdinalIgnoreCase))
        {
            payment.Status = "failed";
            payment.UpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task MarkAttemptAsync(string? transactionId, string status, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(transactionId))
            return;

        var payment = await _dbContext.Payments
            .FirstOrDefaultAsync(p => p.TransactionId == transactionId, cancellationToken);

        // Don't downgrade a payment the IPN already confirmed.
        if (payment == null || string.Equals(payment.Status, "completed", StringComparison.OrdinalIgnoreCase))
            return;

        payment.Status = status;
        payment.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    /// <summary>value_a carries our order id; fall back to parsing the tran_id prefix.</summary>
    private static long? ResolveOrderId(Dictionary<string, string> form, SslCommerzValidationResult validation)
    {
        var valueA = Field(form, "value_a");
        if (long.TryParse(valueA, NumberStyles.Integer, CultureInfo.InvariantCulture, out var fromValueA))
            return fromValueA;

        var tranId = validation.TransactionId ?? Field(form, "tran_id");
        if (string.IsNullOrWhiteSpace(tranId) || !tranId.StartsWith("OW", StringComparison.Ordinal))
            return null;

        var dash = tranId.IndexOf('-');
        var digits = dash > 2 ? tranId[2..dash] : tranId[2..];
        return long.TryParse(digits, NumberStyles.Integer, CultureInfo.InvariantCulture, out var fromTranId)
            ? fromTranId
            : null;
    }

    private static string? Field(Dictionary<string, string> form, string key) =>
        form.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value) ? value : null;

    /// <summary>
    /// Default landing page when the client didn't supply one: the app-wide
    /// "FrontendUrl", or SslCommerz:FrontendReturnUrl if that is set.
    /// </summary>
    private string DefaultReturnUrl() =>
        !string.IsNullOrWhiteSpace(_options.FrontendReturnUrl)
            ? _options.FrontendReturnUrl
            : _configuration["FrontendUrl"] ?? string.Empty;

    /// <summary>
    /// Accept a client-supplied return URL only when its origin is allowed —
    /// otherwise this endpoint becomes an open redirect.
    /// </summary>
    private string ResolveReturnUrl(string? candidate)
    {
        var fallback = DefaultReturnUrl();

        if (string.IsNullOrWhiteSpace(candidate))
            return fallback;

        if (!Uri.TryCreate(candidate, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            _logger.LogWarning("Ignoring malformed payment returnUrl {ReturnUrl}", candidate);
            return fallback;
        }

        var allowed = new List<string>(_options.AllowedReturnOrigins);
        if (Uri.TryCreate(fallback, UriKind.Absolute, out var fallbackUri))
            allowed.Add(fallbackUri.GetLeftPart(UriPartial.Authority));

        var origin = uri.GetLeftPart(UriPartial.Authority);
        var permitted = allowed.Any(entry =>
            Uri.TryCreate(entry, UriKind.Absolute, out var allowedUri)
                ? string.Equals(allowedUri.GetLeftPart(UriPartial.Authority), origin, StringComparison.OrdinalIgnoreCase)
                : string.Equals(entry.TrimEnd('/'), origin, StringComparison.OrdinalIgnoreCase));

        if (!permitted)
        {
            _logger.LogWarning("Rejected payment returnUrl on disallowed origin {Origin}", origin);
            return fallback;
        }

        return candidate;
    }

    private IActionResult RedirectToFrontend(string status, string? transactionId)
    {
        // Prefer the URL captured at initiate time; fall back to configuration.
        Request.Cookies.TryGetValue(ReturnUrlCookie, out var stored);
        var target = ResolveReturnUrl(stored);

        Response.Cookies.Delete(ReturnUrlCookie);

        if (string.IsNullOrWhiteSpace(target))
            return Ok(new { status, transactionId });

        var separator = target.Contains('?') ? "&" : "?";
        var url = $"{target}{separator}payment={Uri.EscapeDataString(status)}";
        if (!string.IsNullOrWhiteSpace(transactionId))
            url += $"&tran_id={Uri.EscapeDataString(transactionId)}";

        return Redirect(url);
    }
}
