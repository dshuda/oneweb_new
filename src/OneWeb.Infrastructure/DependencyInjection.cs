using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OneWeb.Domain.Auth;
using OneWeb.Domain.Bulk;
using OneWeb.Domain.Interfaces;
using OneWeb.Domain.Payments;
using OneWeb.Domain.Sms;
using OneWeb.Domain.Storage;
using OneWeb.Infrastructure.Bulk;
using OneWeb.Infrastructure.Persistence;
using OneWeb.Infrastructure.Services;
using StackExchange.Redis;

namespace OneWeb.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration config)
    {
        // Add DbContext with PostgreSQL and snake_case naming
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                config.GetConnectionString("Default"),
                npgsqlOptions => npgsqlOptions
                    .MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)
                    // PostGIS geometry mapping — order service locations are
                    // stored as a real Point rather than loose lat/lng strings.
                    .UseNetTopologySuite())
                .UseSnakeCaseNamingConvention());


        services.Configure<BulkSMS>(config.GetSection("BulkSMS"));

        // Bootstrap master phone / OTP used to log in without a live SMS gateway
        services.Configure<MasterAuthOptions>(config.GetSection(MasterAuthOptions.SectionName));

        // SSL Wireless (SMS) and SSLCommerz (payment) gateways
        services.Configure<SslWirelessOptions>(config.GetSection(SslWirelessOptions.SectionName));
        services.Configure<SslCommerzOptions>(config.GetSection(SslCommerzOptions.SectionName));

        // DigitalOcean Spaces CDN for storefront imagery
        services.Configure<CdnOptions>(config.GetSection(CdnOptions.SectionName));
        services.AddSingleton<ICdnService, CdnService>();

        // Rate limiting for the unauthenticated, SMS-spending send-otp endpoint
        services.Configure<OtpRateLimitOptions>(config.GetSection(OtpRateLimitOptions.SectionName));
        services.AddScoped<IOtpRateLimiter, RedisOtpRateLimiter>();


        // Add Redis connection
        services.AddSingleton<IConnectionMultiplexer>(_ =>
            ConnectionMultiplexer.Connect(config["Redis:ConnectionString"]!));

        // Add Redis distributed cache
        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = config["Redis:ConnectionString"];
            options.InstanceName = "OneWeb_";
        });

        // Initialize Firebase
        var firebaseCredentialsPath = config["Firebase:CredentialsPath"];
        if (FirebaseApp.DefaultInstance == null && !string.IsNullOrEmpty(firebaseCredentialsPath) && File.Exists(firebaseCredentialsPath))
        {
            FirebaseApp.Create(new AppOptions
            {
                Credential = GoogleCredential.FromFile(firebaseCredentialsPath)
            });
        }

        // Register services
        services.AddHttpClient();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<RefreshTokenService>();
        services.AddScoped<IOtpService, OtpService>();
        // Typed HttpClient registrations — AddHttpClient also registers the service.
        services.AddHttpClient<ISmsService, SslWirelessSmsService>();
        services.AddHttpClient<ISslCommerzService, SslCommerzService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IFcmService, FcmService>();
        services.AddScoped<IDashboardCacheService, DashboardCacheService>();
        // add bulk sms services
        services.AddScoped<IBulkSMServices, BulkSMSServices>();
        return services;
    }
}
