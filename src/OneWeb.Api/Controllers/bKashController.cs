using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace OneWeb.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BKashController : ControllerBase
{
        private readonly IBKashService _bkashService;
        private readonly ILogger<BKashController> _logger;

        public BKashController(IBKashService bkashService, ILogger<BKashController> logger)
        {
            _bkashService = bkashService;
            _logger = logger;
        }

        [HttpPost("payment/create")]
        public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentRequestDto request)
        {
            try
            {
                var bkashRequest = new CreatePaymentRequest
                {
                    PayerReference = request.PayerReference,
                    CallbackURL = $"{GetBaseUrl()}/api/bkash/payment/callback",
                    Amount = request.Amount,
                    Currency = "BDT",
                    Intent = "sale",
                    MerchantInvoiceNumber = request.MerchantInvoiceNumber
                };

                var response = await _bkashService.CreatePaymentAsync(bkashRequest);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating bKash payment");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("payment/create-with-agreement")]
        public async Task<IActionResult> CreatePaymentWithAgreement([FromBody] CreatePaymentWithAgreementRequestDto request)
        {
            try
            {
                var bkashRequest = new CreatePaymentWithAgreementRequest
                {
                    AgreementId = request.AgreementId,
                    PayerReference = request.PayerReference,
                    CallbackURL = $"{GetBaseUrl()}/api/bkash/payment/callback",
                    Amount = request.Amount,
                    Currency = "BDT",
                    Intent = "sale",
                    MerchantInvoiceNumber = request.MerchantInvoiceNumber
                };

                var response = await _bkashService.CreatePaymentWithAgreementAsync(bkashRequest);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating bKash payment with agreement");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("payment/execute")]
        public async Task<IActionResult> ExecutePayment([FromBody] ExecutePaymentRequestDto request)
        {
            try
            {
                var response = await _bkashService.ExecutePaymentAsync(request.PaymentId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing bKash payment");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("query/payment")]
        public async Task<IActionResult> QueryPayment([FromBody] QueryPaymentRequestDto request)
        {
            try
            {
                var response = await _bkashService.QueryPaymentAsync(request.PaymentId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error querying bKash payment");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("agreement/create")]
        public async Task<IActionResult> CreateAgreement([FromBody] CreateAgreementRequestDto request)
        {
            try
            {
                var bkashRequest = new CreateAgreementRequest
                {
                    PayerReference = request.PayerReference,
                    CallbackURL = $"{GetBaseUrl()}/api/bkash/agreement/callback"
                };

                var response = await _bkashService.CreateAgreementAsync(bkashRequest);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating bKash agreement");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("agreement/execute")]
        public async Task<IActionResult> ExecuteAgreement([FromBody] ExecuteAgreementRequestDto request)
        {
            try
            {
                var response = await _bkashService.ExecuteAgreementAsync(request.AgreementId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing bKash agreement");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("agreement/cancel")]
        public async Task<IActionResult> CancelAgreement([FromBody] CancelAgreementRequestDto request)
        {
            try
            {
               // var response = await _bkashService.CancelAgreementAsync(request.AgreementId);
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error canceling bKash agreement");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("query/agreement")]
        public async Task<IActionResult> QueryAgreement([FromBody] QueryAgreementRequestDto request)
        {
            try
            {
                var response = await _bkashService.QueryAgreementAsync(request.AgreementId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error querying bKash agreement");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("refund/payment")]
        public async Task<IActionResult> Refund([FromBody] RefundRequestDto request)
        {
            try
            {
                var bkashRequest = new RefundRequest
                {
                    PaymentId = request.PaymentId,
                    RefundAmount = request.RefundAmount,
                    TransactionId = request.TransactionId,
                    Reason = request.Reason,
                    Sku = request.Sku
                };

                var response = await _bkashService.RefundAsync(bkashRequest);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing refund");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("refund/status")]
        public async Task<IActionResult> RefundStatus([FromBody] RefundStatusRequestDto request)
        {
            try
            {
                var bkashRequest = new RefundStatusRequest
                {
                    PaymentId = request.PaymentId,
                    TransactionId = request.TransactionId
                };

                var response = await _bkashService.RefundStatusAsync(bkashRequest);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting refund status");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("payment/callback")]
        public async Task<IActionResult> PaymentCallback(
            [FromQuery] string paymentId,
            [FromQuery] string status,
            [FromQuery] string signature,
            [FromQuery] string agreementId = null)
        {
            try
            {
                // Store callback info for frontend to retrieve
                // This can be done via session, cache, or redirect with query params
                var callbackData = new
                {
                    paymentId,
                    status,
                    signature,
                    agreementId,
                    timestamp = DateTime.UtcNow
                };

                // Redirect to frontend with callback data
                var redirectUrl = $"{GetFrontendUrl()}/orders/callback?paymentId={paymentId}&status={status}&signature={signature}&agreementId={agreementId}";
                return Redirect(redirectUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing payment callback");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("agreement/callback")]
        public async Task<IActionResult> AgreementCallback(
            [FromQuery] string agreementId,
            [FromQuery] string status,
            [FromQuery] string signature)
        {
            try
            {
                // Redirect to frontend with callback data
                var redirectUrl = $"{GetFrontendUrl()}/orders/callback?agreementId={agreementId}&status={status}&signature={signature}";
                return Redirect(redirectUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing agreement callback");
                return BadRequest(new { error = ex.Message });
            }
        }

        private string GetBaseUrl()
        {
            var request = HttpContext.Request;
            return $"{request.Scheme}://{request.Host}";
        }

        private string GetFrontendUrl()
        {
            return "https://your-frontend-url.com";
        }
    }








    // Request DTOs
    public class CreatePaymentRequestDto
    {
        public int OrderId { get; set; }
        public decimal Amount { get; set; }
        public string PayerReference { get; set; }
        public string MerchantInvoiceNumber { get; set; }
    }

    public class CreatePaymentWithAgreementRequestDto
    {
        public int OrderId { get; set; }
        public string AgreementId { get; set; }
        public decimal Amount { get; set; }
        public string PayerReference { get; set; }
        public string MerchantInvoiceNumber { get; set; }
    }

    public class ExecutePaymentRequestDto
    {
        public string PaymentId { get; set; }
        public int? OrderId { get; set; }
    }

    public class QueryPaymentRequestDto
    {
        public string PaymentId { get; set; }
    }

    public class CreateAgreementRequestDto
    {
        public string PayerReference { get; set; }
    }

    public class ExecuteAgreementRequestDto
    {
        public string AgreementId { get; set; }
    }

    public class CancelAgreementRequestDto
    {
        public string AgreementId { get; set; }
    }

    public class QueryAgreementRequestDto
    {
        public string AgreementId { get; set; }
    }

    public class RefundRequestDto
    {
        public string PaymentId { get; set; }
        public string RefundAmount { get; set; }
        public string TransactionId { get; set; }
        public string Reason { get; set; }
        public string Sku { get; set; }
    }

    public class RefundStatusRequestDto
    {
        public string PaymentId { get; set; }
        public string TransactionId { get; set; }
    }
