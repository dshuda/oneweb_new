using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OneWeb.Domain.Auth;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api;

public partial class Program
{
    public static async Task Main(string[] args)
    {
        var app = Host.CreateDefaultBuilder(args)
            .ConfigureAppConfiguration(config =>
            {
                // Deployment-friendly variable names (see .env.prod), then the
                // canonical Section__Key form last so it can always override.
                config.AddInMemoryCollection(EnvironmentConfiguration.Build());
                config.AddEnvironmentVariables();
            })
            .ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.UseStartup<Startup>();
            })
            .Build();

        // Run migrations + seed
        using (var scope = app.Services.CreateScope())
        {
            var services = scope.ServiceProvider;

            try
            {
                var db = services.GetRequiredService<AppDbContext>();
                var master = services.GetRequiredService<IOptions<MasterAuthOptions>>().Value;
                var logger = services.GetRequiredService<ILogger<Program>>();
                var catalogPath = Path.Combine(AppContext.BaseDirectory, "Seed", "catalog.json");

                await db.Database.MigrateAsync();
                await DatabaseSeeder.SeedAsync(db, master, catalogPath, message => logger.LogInformation("{SeedMessage}", message));
            }
            catch (Exception ex)
            {
                var logger = services.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "An error occurred while migrating or seeding the database.");
            }
        }
        app.Run();
    }

}