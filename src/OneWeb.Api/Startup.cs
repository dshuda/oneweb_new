using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using OneWeb.Api.Hubs;
using OneWeb.Application;
using OneWeb.Domain.Entities;
using OneWeb.Domain.Interfaces;
using OneWeb.Infrastructure;
using System.Text;

namespace OneWeb.Api;

public class Startup
{
    private readonly IHostEnvironment _env;
    private readonly IConfiguration _configuration;
    public Startup(IHostEnvironment env, IConfiguration configuration)
    {
        _env = env;
        _configuration = configuration;
    }
    public void ConfigureServices(IServiceCollection services)
    {

        // Add Infrastructure services (DbContext, Redis, etc.)
        services.AddInfrastructure(_configuration);

        // Add controllers
        services.AddControllers();

        // Overlays per-locale service copy onto responses (see TranslationOverlay).
        services.AddScoped<OneWeb.Api.Localization.TranslationOverlay>();

        // Add SignalR
        services.AddSignalR();

        // Add CORS — restricted to the storefront origins. AllowAnyOrigin lets
        // any site on the internet call the API with a user's credentials.
        // Origins come from Cors:AllowedOrigins, falling back to the payment
        // return allow-list and FrontendUrl so there is one place to configure.
        var corsOrigins = _configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? _configuration.GetSection("SslCommerz:AllowedReturnOrigins").Get<string[]>()
            ?? Array.Empty<string>();

        var frontendUrl = _configuration["FrontendUrl"];
        if (!string.IsNullOrWhiteSpace(frontendUrl))
            corsOrigins = corsOrigins.Append(frontendUrl).ToArray();

        corsOrigins = corsOrigins
            .Where(o => !string.IsNullOrWhiteSpace(o))
            .Select(o => o.TrimEnd('/'))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", policy =>
            {
                if (corsOrigins.Length == 0)
                {
                    // Nothing configured (local dev): stay permissive rather than
                    // break the site, but credentials still cannot be sent.
                    policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
                }
                else
                {
                    policy.WithOrigins(corsOrigins)
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .AllowCredentials();
                }
            });
        });

        // Add Endpoints API explorer
        services.AddEndpointsApiExplorer();

        // Add Swagger
        services.AddSwaggerGen(c =>
        {
            c.CustomSchemaIds(type => type.FullName);
        });

        // Add MediatR
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(ApplicationAssemblyMarker).Assembly));

        // Add NotificationService
        services.AddScoped<OneWeb.Domain.Interfaces.INotificationService, OneWeb.Api.Services.NotificationService>();

        services.Configure<BKashConfig>(_configuration.GetSection("BKash"));
        // bKash Service
        services.AddScoped<IBKashService, BKashService>();


        // TODO: Add AutoMapper later
        // builder.Services.AddAutoMapper(typeof(ApplicationAssemblyMarker));

        // Add JWT Authentication
        var jwtSettings = _configuration.GetSection("Jwt");
        var secretKey = jwtSettings["SecretKey"];

        // Refuse to start on a missing or trivially short signing key. Shipping a
        // default key lets anyone who has seen the repo forge admin tokens.
        if (string.IsNullOrWhiteSpace(secretKey) || secretKey.Length < 32)
        {
            throw new InvalidOperationException(
                "Jwt:SecretKey is missing or shorter than 32 characters. " +
                "Set Jwt__SecretKey in the environment (see .env.prod).");
        }

        var key = Encoding.UTF8.GetBytes(secretKey);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidateAudience = true,
                ValidAudience = jwtSettings["Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,
                RoleClaimType = System.Security.Claims.ClaimTypes.Role
            };
        });
    }
    public void Configure(IApplicationBuilder app)
    {


        // Configure the HTTP request pipeline
        if (_env.IsDevelopment())
        {
            
        }
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "OneWeb API v1");
        });
        app.UseRouting();
        app.UseCors("AllowAll");
        app.UseStaticFiles();
        app.UseHttpsRedirection();
        app.UseAuthentication();
        app.UseAuthorization();

        app.UseEndpoints(ep =>
        {
            ep.MapControllers();
            ep.MapHub<OneWeb.Api.Hubs.OrderHub>("/hubs/orders");
        });



    }


}
