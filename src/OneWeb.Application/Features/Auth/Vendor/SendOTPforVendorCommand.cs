using MediatR;
using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Interfaces;
using OneWeb.Infrastructure.Bulk;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Application.Features.Auth.Vendor;

public class SendOTPforVendorCommand : IRequest<SendVendorOtpResult>
{
    public string Mobile { get; set; }
}

internal class SendOTPforVendorCommandHandler : IRequestHandler<SendOTPforVendorCommand, SendVendorOtpResult>
{
    private readonly IOtpService _otpService;
    private readonly IBulkSMServices _smsServices;
    private readonly AppDbContext _context;

    public SendOTPforVendorCommandHandler(IOtpService otpService, IBulkSMServices smsServices, AppDbContext context)
    {
        _otpService = otpService;
        _smsServices = smsServices;
        _context = context;
    }
    public async Task<SendVendorOtpResult> Handle(SendOTPforVendorCommand request, CancellationToken cancellationToken)
    {
        // Validate phone: must be 11 digits starting with 01
        if (string.IsNullOrEmpty(request.Mobile) || request.Mobile.Length != 11 || !request.Mobile.StartsWith("01"))
            return new SendVendorOtpResult(false, "Invalid phone number");
        
        if(await _context.Vendors.AnyAsync(f=>f.User.Phone == request.Mobile, cancellationToken))
        {
          var otp =  await _otpService.GenerateAndSaveOtpAsync(request.Mobile);
          await _smsServices.SendAsync(request.Mobile, $"Your login OTP is {otp} as a vendor, don't share to other");
        }

        return new SendVendorOtpResult(true, "OTP Sent to vendor Mobile number");
    }
}

public record SendVendorOtpResult(bool Success, string Message);