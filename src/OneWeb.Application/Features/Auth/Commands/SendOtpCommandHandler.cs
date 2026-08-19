using MediatR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OneWeb.Domain.Auth;
using OneWeb.Domain.Interfaces;
using OneWeb.Domain.Sms;
using OneWeb.Infrastructure.Bulk;

namespace OneWeb.Application.Features.Auth.Commands;

public class SendOtpCommandHandler : IRequestHandler<SendOtpCommand, SendOtpResult>
{
    private readonly IOtpService _otpService;
    private readonly ISmsService _smsService;
    private readonly IBulkSMServices _bulkSmsServices;
    private readonly MasterAuthOptions _master;
    private readonly SslWirelessOptions _sslWireless;
    private readonly IOtpRateLimiter _rateLimiter;
    private readonly ILogger<SendOtpCommandHandler> _logger;

    public SendOtpCommandHandler(
        IOtpService otpService,
        ISmsService smsService,
        IBulkSMServices bulkSmsServices,
        IOptions<MasterAuthOptions> master,
        IOptions<SslWirelessOptions> sslWireless,
        IOtpRateLimiter rateLimiter,
        ILogger<SendOtpCommandHandler> logger)
    {
        _otpService = otpService;
        _smsService = smsService;
        _bulkSmsServices = bulkSmsServices;
        _master = master.Value;
        _sslWireless = sslWireless.Value;
        _rateLimiter = rateLimiter;
        _logger = logger;
    }

    public async Task<SendOtpResult> Handle(SendOtpCommand request, CancellationToken cancellationToken)
    {
        // Validate phone: must be 11 digits starting with 01
        if (string.IsNullOrEmpty(request.Phone) || request.Phone.Length != 11 || !request.Phone.StartsWith("01"))
            return new SendOtpResult(false, "Invalid phone number");

        // The master number is exempt: it costs nothing and sends no SMS.
        if (!_master.IsMasterPhone(request.Phone))
        {
            var limit = await _rateLimiter.TryAcquireAsync(request.Phone, request.IpAddress, cancellationToken);
            if (!limit.Allowed)
            {
                _logger.LogWarning(
                    "send-otp rate limited for {Phone} from {Ip}: {Reason}",
                    request.Phone, request.IpAddress ?? "unknown", limit.Reason);
                return new SendOtpResult(false, limit.Reason ?? "Too many requests", limit.RetryAfterSeconds);
            }
        }

        try
        {
            var otp = await _otpService.GenerateAndSaveOtpAsync(request.Phone);

            if (_master.IsMasterPhone(request.Phone))
                return new SendOtpResult(true, "OTP sent successfully");

            // SSL Wireless is the primary gateway; BulkSMS stays as a fallback
            // so a gateway outage doesn't lock customers out.
            if (_sslWireless.IsConfigured)
            {
                var result = await _smsService.SendAsync(
                    request.Phone,
                    $"Your OneTap verification code is {otp}. It expires in 5 minutes.");

                if (result.Success)
                    return new SendOtpResult(true, "OTP sent successfully");

                _logger.LogWarning(
                    "SSL Wireless could not deliver the OTP ({Error}); falling back to BulkSMS",
                    result.ErrorMessage);
            }

            await _bulkSmsServices.SendAsync("88" + request.Phone, $"Your otp  is : {otp}");

            return new SendOtpResult(true, "OTP sent successfully");
        }
        catch (Exception ex)
        {
            return new SendOtpResult(false, $"Error: {ex.Message}");
        }
    }
}
