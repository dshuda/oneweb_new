using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using OneWeb.Domain.Interfaces;
using System.Security.Claims;

namespace OneWeb.Api.Controllers;

[ApiController]
[Route("api/v1/payments")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    private long GetUserId() =>
        long.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);

    [HttpPost("cod")]
    public async Task<IActionResult> ProcessCod([FromBody] CodPaymentRequest request)
    {
        var userId = GetUserId();
        var result = await _paymentService.ProcessCodPaymentAsync(request.OrderId, userId);

        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(new { transactionId = result.TransactionId, message = result.Message });
    }

    [HttpPost("initiate")]
    public async Task<IActionResult> InitiatePayment([FromBody] InitiatePaymentRequest request)
    {
        var userId = GetUserId();
        var result = await _paymentService.InitiateMobilePaymentAsync(
            request.OrderId, userId, request.Provider, request.Amount);

        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(new { paymentUrl = result.PaymentUrl, transactionId = result.TransactionId });
    }

    [HttpPost("verify")]
    public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentRequest request)
    {
        var result = await _paymentService.VerifyMobilePaymentAsync(
            request.OrderId, request.TransactionId, request.Provider);

        if (!result)
            return BadRequest(new { message = "Payment verification failed" });

        return Ok(new { message = "Payment verified successfully" });
    }

    public record CodPaymentRequest(long OrderId);
    public record InitiatePaymentRequest(long OrderId, string Provider, double Amount);
    public record VerifyPaymentRequest(long OrderId, string TransactionId, string Provider);
}
