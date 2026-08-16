using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OneWeb.Domain.Bulk;
using OneWeb.Domain.Interfaces;
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
                npgsqlOptions => npgsqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName))
                .UseSnakeCaseNamingConvention());


        services.Configure<BulkSMS>(config.GetSection("BulkSMS"));


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
        services.AddScoped<ISmsService, SmsService>();
        services.AddHttpClient<ISmsService, SmsService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<ISslCommerzService, SslCommerzService>();
        services.AddScoped<IFcmService, FcmService>();
        services.AddScoped<IDashboardCacheService, DashboardCacheService>();
        // add bulk sms services
        services.AddScoped<IBulkSMServices, BulkSMSServices>();
        return services;
    }
}
