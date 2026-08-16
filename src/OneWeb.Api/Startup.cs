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

        // Add SignalR
        services.AddSignalR();

        // Add CORS
        services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", policy =>
            {
                policy.AllowAnyOrigin()
                      .AllowAnyMethod()
                      .AllowAnyHeader();
            });
        });

        // Increase multipart upload size limits (100MB)
        services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
        {
            options.ValueLengthLimit = int.MaxValue;
            options.MultipartBodyLengthLimit = 104857600; // 100MB
            options.MultipartHeadersLengthLimit = int.MaxValue;
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
        var key = Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!);

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
