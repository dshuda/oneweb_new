using Microsoft.EntityFrameworkCore;
using OneWeb.Infrastructure.Persistence;

namespace OneWeb.Api;

public partial class Program
{
    public static async Task Main(string[] args)
    {
        var app = Host.CreateDefaultBuilder(args)
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

                await db.Database.MigrateAsync();
                await DatabaseSeeder.SeedAsync(db);
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