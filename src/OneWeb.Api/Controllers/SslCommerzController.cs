using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OneWeb.Domain.Interfaces;

namespace OneWeb.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class SslCommerzController : ControllerBase
{
    private readonly ISslCommerzService _sslCommerzService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SslCommerzController> _logger;

    public SslCommerzController(
        ISslCommerzService sslCommerzService,
        IConfiguration configuration,
        ILogger<SslCommerzController> logger)
    {
        _sslCommerzService = sslCommerzService;
        _configuration = configuration;
        _logger = logger;
    }

    public record InitiateSslPaymentRequest(long OrderId);

    [Authorize]
    [HttpPost("initiate")]
    public async Task<IActionResult> Initiate([FromBody] InitiateSslPaymentRequest request)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !long.TryParse(userIdClaim.Value, out var userId))
            return Unauthorized(new { message = "Invalid user token" });

        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var result = await _sslCommerzService.InitiatePaymentAsync(request.OrderId, userId, baseUrl);

        if (!result.Success)
            return BadRequest(new { success = false, message = result.Message });

        return Ok(new
        {
            success = true,
            gatewayPageUrl = result.GatewayPageUrl,
            sessionKey = result.SessionKey,
            transactionId = result.TransactionId,
            message = result.Message
        });
    }

    [HttpPost("success")]
    [Consumes("application/x-www-form-urlencoded")]
    [AllowAnonymous]
    public async Task<IActionResult> Success([FromForm] IFormCollection form)
    {
        var tranId = form["tran_id"].ToString();
        var valId = form["val_id"].ToString();
        var amountStr = form["amount"].ToString();
        var cardType = form["card_type"].ToString();
        var bankTranId = form["bank_tran_id"].ToString();
        var status = form["status"].ToString();

        _logger.LogInformation("SSLCommerz Success Callback received for TranId: {TranId}, ValId: {ValId}, Status: {Status}", tranId, valId, status);

        double.TryParse(amountStr, out var amount);

        // Validate transaction with SSLCommerz server
        var validation = await _sslCommerzService.ValidatePaymentAsync(valId, tranId, amount);
        if (validation.IsValid)
        {
            await _sslCommerzService.ProcessPaymentSuccessAsync(valId, tranId, validation.Amount > 0 ? validation.Amount : amount, cardType, bankTranId);
            return RedirectToFrontend(true, tranId, "Payment completed successfully");
        }
        else
        {
            _logger.LogWarning("SSLCommerz Validation failed for TranId {TranId}: {Reason}", tranId, validation.Message);
            await _sslCommerzService.ProcessPaymentFailAsync(tranId, validation.Message);
            return RedirectToFrontend(false, tranId, validation.Message ?? "Payment verification failed");
        }
    }

    [HttpPost("fail")]
    [Consumes("application/x-www-form-urlencoded")]
    [AllowAnonymous]
    public async Task<IActionResult> Fail([FromForm] IFormCollection form)
    {
        var tranId = form["tran_id"].ToString();
        var error = form["error"].ToString();
        var status = form["status"].ToString();

        _logger.LogWarning("SSLCommerz Fail Callback for TranId {TranId}, Error: {Error}, Status: {Status}", tranId, error, status);
        await _sslCommerzService.ProcessPaymentFailAsync(tranId, error);

        return RedirectToFrontend(false, tranId, error ?? "Payment failed or declined");
    }

    [HttpPost("cancel")]
    [Consumes("application/x-www-form-urlencoded")]
    [AllowAnonymous]
    public async Task<IActionResult> Cancel([FromForm] IFormCollection form)
    {
        var tranId = form["tran_id"].ToString();
        _logger.LogInformation("SSLCommerz Cancel Callback for TranId {TranId}", tranId);
        await _sslCommerzService.ProcessPaymentCancelAsync(tranId);

        return RedirectToFrontend(false, tranId, "Payment was cancelled by user");
    }

    [HttpPost("ipn")]
    [Consumes("application/x-www-form-urlencoded")]
    [AllowAnonymous]
    public async Task<IActionResult> Ipn([FromForm] IFormCollection form)
    {
        var tranId = form["tran_id"].ToString();
        var valId = form["val_id"].ToString();
        var amountStr = form["amount"].ToString();
        var cardType = form["card_type"].ToString();
        var bankTranId = form["bank_tran_id"].ToString();
        var status = form["status"].ToString();

        _logger.LogInformation("SSLCommerz IPN received: TranId={TranId}, ValId={ValId}, Status={Status}", tranId, valId, status);

        double.TryParse(amountStr, out var amount);
        var validation = await _sslCommerzService.ValidatePaymentAsync(valId, tranId, amount);
        if (validation.IsValid)
        {
            await _sslCommerzService.ProcessPaymentSuccessAsync(valId, tranId, validation.Amount > 0 ? validation.Amount : amount, cardType, bankTranId);
            return Ok(new { status = "IPN_SUCCESS", tran_id = tranId });
        }

        return BadRequest(new { status = "IPN_FAILED", message = validation.Message });
    }

    private IActionResult RedirectToFrontend(bool success, string tranId, string message)
    {
        var frontendUrl = _configuration["FrontendUrl"]?.Replace("/web", "") ?? "http://104.248.232.169";
        var redirectUrl = $"{frontendUrl.TrimEnd('/')}/profile?tab=bookings&payment={(success ? "success" : "failed")}&tran_id={Uri.EscapeDataString(tranId)}&msg={Uri.EscapeDataString(message)}";
        return Redirect(redirectUrl);
    }
}
