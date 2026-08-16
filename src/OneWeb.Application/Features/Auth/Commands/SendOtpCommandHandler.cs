using MediatR;
using OneWeb.Domain.Interfaces;
using OneWeb.Infrastructure.Bulk;

namespace OneWeb.Application.Features.Auth.Commands;

public class SendOtpCommandHandler : IRequestHandler<SendOtpCommand, SendOtpResult>
{
    private readonly IOtpService _otpService;
    //private readonly ISmsService _smsService;
    private readonly IBulkSMServices _smsServices;
    public SendOtpCommandHandler(IOtpService otpService, IBulkSMServices smsServices)
    {
        _otpService = otpService;
        _smsServices = smsServices;
    }
    
    public async Task<SendOtpResult> Handle(SendOtpCommand request, CancellationToken cancellationToken)
    {
        // Validate phone: must be 11 digits starting with 01
        if (string.IsNullOrEmpty(request.Phone) || request.Phone.Length != 11 || !request.Phone.StartsWith("01"))
            return new SendOtpResult(false, "Invalid phone number");
        
        try
        {
            var otp = await _otpService.GenerateAndSaveOtpAsync(request.Phone);
            var smsSent = await _smsServices.SendAsync("88" + request.Phone, $"Your OneTap OTP is {otp}");
            
            return new SendOtpResult(true, "OTP sent successfully");
        }
        catch (Exception ex)
        {
            return new SendOtpResult(false, $"Error: {ex.Message}");
        }
    }
}
