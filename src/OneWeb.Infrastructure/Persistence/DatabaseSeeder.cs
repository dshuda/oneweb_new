using Microsoft.EntityFrameworkCore;
using OneWeb.Domain.Auth;
using OneWeb.Domain.Entities;
using BCrypt.Net;

namespace OneWeb.Infrastructure.Persistence;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(
        AppDbContext db,
        MasterAuthOptions? master = null,
        string? catalogPath = null,
        Action<string>? log = null)
    {
        await SeedAdminUser(db);
        await SeedMasterCustomer(db, master ?? new MasterAuthOptions());
        await SeedPortalAdmin(db);
        await SeedBusinessSettings(db);
        await SeedDivisions(db);
        await SeedDistricts(db);
        
        // Both catalogues are seeded so the storefront carries the union of them:
        // first the original backend tree (AC Servicing, Car Care, …), then the
        // design catalogue exported from the website (Cleaning, Shifting, …).
        // Slugs don't overlap, and CatalogSeeder upserts, so this is idempotent.
        await SeedServiceCategories(db);

        if (!string.IsNullOrWhiteSpace(catalogPath) && File.Exists(catalogPath))
            await CatalogSeeder.SeedAsync(db, catalogPath!, log);

        await SeedLanguages(db);
        await SeedCustomPages(db);
        await SeedBlogCategories(db);
        await SeedBlogs(db);
        await SeedCoupons(db);
        await SeedSliders(db);
        await SeedUsersAndVendors(db);
        await SeedVendorServices(db);
        await SeedOrdersAndRelated(db);
    }

    private static async Task SeedAdminUser(AppDbContext db)
    {
        if (await db.Users.AnyAsync(u => u.Email == "admin@oneweb.com"))
            return;

        var admin = new User { Name = "OneWeb Admin", Email = "admin@oneweb.com", Password = BCrypt.Net.BCrypt.HashPassword("Admin@123"), UserType = "admin", Status = true, IsApproved = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        db.Users.Add(admin);

        var existingUser = await db.Users.FirstOrDefaultAsync(u => u.Email == "test@oneweb.com");
        if (existingUser != null)
        {
            existingUser.Password = BCrypt.Net.BCrypt.HashPassword("Pass123!");
            db.Users.Update(existingUser);
        }
        else
        {
            var TestAdmin = new User { Name = "User Admin", Email = "user@oneweb.com", Password = BCrypt.Net.BCrypt.HashPassword("Pass123!"), UserType = "admin", Status = true, IsApproved = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            db.Users.Add(TestAdmin);
        }

        if (!await db.Users.AnyAsync(u => u.Email == "testadmin@oneweb.com"))
            db.Users.Add(new User { Name = "Test Admin", Email = "testadmin@oneweb.com", Password = BCrypt.Net.BCrypt.HashPassword("Admin123!"), UserType = "admin", Status = true, IsApproved = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
            
        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Bootstrap customer used to sign into the website with the master phone /
    /// OTP pair while no SMS gateway is wired up. Idempotent: only fills in the
    /// gaps if the account already exists.
    /// </summary>
    private static async Task SeedMasterCustomer(AppDbContext db, MasterAuthOptions master)
    {
        if (!master.Enabled || string.IsNullOrWhiteSpace(master.Phone))
            return;

        var user = await db.Users.FirstOrDefaultAsync(u => u.Phone == master.Phone);

        if (user == null)
        {
            db.Users.Add(new User
            {
                Name = master.Name,
                Phone = master.Phone,
                CountryCode = "+880",
                UserType = "customer",
                Status = true,
                IsApproved = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }
        else
        {
            // Keep the account usable even if it was created by an earlier login.
            if (string.IsNullOrWhiteSpace(user.Name)) user.Name = master.Name;
            user.Status = true;
            user.IsApproved = true;
            user.IsBanned = false;
            user.UpdatedAt = DateTime.UtcNow;
            db.Users.Update(user);
        }

        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Bootstrap portal administrator. Idempotent: refreshes the password and
    /// re-enables the account on every start so a lockout is always recoverable.
    /// </summary>
    private static async Task SeedPortalAdmin(AppDbContext db)
    {
        const string phone = "01347201751";
        const string email = "faruk.hannan@onetapservice.com";
        const string password = "OnetapService@2026";

        var admin = await db.Users.FirstOrDefaultAsync(u => u.Phone == phone || u.Email == email);

        if (admin == null)
        {
            admin = new User { CreatedAt = DateTime.UtcNow };
            db.Users.Add(admin);
        }

        admin.Name = "Faruk Hannan";
        admin.Email = email;
        admin.Phone = phone;
        admin.CountryCode = "+880";
        admin.UserType = "admin";
        admin.Password = BCrypt.Net.BCrypt.HashPassword(password);
        admin.Status = true;
        admin.IsApproved = true;
        admin.IsBanned = false;
        admin.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
    }

    private static async Task SeedBusinessSettings(AppDbContext db)
    {
        if (await db.BusinessSettings.AnyAsync()) return;
        var settings = new List<BusinessSetting>
        {
            new() { Type = "vendor_commission", Value = "15", Lang = "en", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new() { Type = "current_version_android", Value = "1.0.0", Lang = "en", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new() { Type = "minimum_version_required_android", Value = "1.0.0", Lang = "en", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new() { Type = "current_version_ios", Value = "1.0.0", Lang = "en", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new() { Type = "minimum_version_required_ios", Value = "1.0.0", Lang = "en", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
        };
        db.BusinessSettings.AddRange(settings);
        await db.SaveChangesAsync();
    }

    private static async Task SeedDivisions(AppDbContext db)
    {
        if (await db.Divisions.AnyAsync()) return;
        var divisions = new List<Division>
        {
            new() { Name = "Dhaka", BnName = "ঢাকা", Status = true },
            new() { Name = "Chittagong", BnName = "চট্টগ্রাম", Status = true },
            new() { Name = "Rajshahi", BnName = "রাজশাহী", Status = true },
            new() { Name = "Khulna", BnName = "খুলনা", Status = true },
            new() { Name = "Barisal", BnName = "বরিশাল", Status = true },
            new() { Name = "Sylhet", BnName = "সিলেট", Status = true },
            new() { Name = "Rangpur", BnName = "রংপুর", Status = true },
            new() { Name = "Mymensingh", BnName = "ময়মনসিংহ", Status = true },
        };
        db.Divisions.AddRange(divisions);
        await db.SaveChangesAsync();
    }

    private static async Task SeedDistricts(AppDbContext db)
    {
        if (await db.Districts.AnyAsync()) return;
        var dhakaDivision = await db.Divisions.FirstOrDefaultAsync(d => d.Name == "Dhaka");
        if (dhakaDivision == null) return;
        var districts = new List<District>
        {
            new() { DivisionId = dhakaDivision.Id, Name = "Dhaka", BnName = "ঢাকা", Status = true },
            new() { DivisionId = dhakaDivision.Id, Name = "Gazipur", BnName = "গাজীপুর", Status = true },
            new() { DivisionId = dhakaDivision.Id, Name = "Narayanganj", BnName = "নারায়ণগঞ্জ", Status = true },
        };
        db.Districts.AddRange(districts);
        await db.SaveChangesAsync();
        
        var upazilas = new List<Upazila>
        {
            new() { DistrictId = districts[0].Id, Name = "Mirpur", BnName = "মিরপুর", Status = true, CreatedAt = DateTime.UtcNow },
            new() { DistrictId = districts[0].Id, Name = "Gulshan", BnName = "গুলশান", Status = true, CreatedAt = DateTime.UtcNow },
            new() { DistrictId = districts[0].Id, Name = "Banani", BnName = "বনানী", Status = true, CreatedAt = DateTime.UtcNow },
            new() { DistrictId = districts[0].Id, Name = "Dhanmondi", BnName = "ধানমন্ডি", Status = true, CreatedAt = DateTime.UtcNow }
        };
        db.Upazilas.AddRange(upazilas);
        await db.SaveChangesAsync();
    }

    private static async Task SeedServiceCategories(AppDbContext db)
    {
        if (await db.Services.AnyAsync()) return;

        var categories = new List<Service>
        {
            new() { ParentId = null, Name = "AC Servicing", Slug = "ac-servicing", Level = 0, Status = true, InitialPrice = 0, ServiceIcon = "wind", CreatedAt = DateTime.UtcNow },
            new() { ParentId = null, Name = "Plumbing & Water", Slug = "plumbing-water",  Level = 0, Status = true, InitialPrice = 0, ServiceIcon = "droplets", CreatedAt = DateTime.UtcNow },
            new() { ParentId = null, Name = "Electrical Repairs", Slug = "electrical-repairs",  Level = 0, Status = true, InitialPrice = 0, ServiceIcon = "zap", CreatedAt = DateTime.UtcNow },
            new() { ParentId = null, Name = "Deep Cleaning", Slug = "deep-cleaning",  Level = 0, Status = true, InitialPrice = 0, ServiceIcon = "sparkles", CreatedAt = DateTime.UtcNow },
            new() { ParentId = null, Name = "Home Shifting", Slug = "home-shifting",  Level = 0, Status = true, InitialPrice = 0, ServiceIcon = "truck", CreatedAt = DateTime.UtcNow },
            new() { ParentId = null, Name = "Car Care", Slug = "car-care", Level = 0, Status = true, InitialPrice = 0, ServiceIcon = "car", CreatedAt = DateTime.UtcNow },
        };

        db.Services.AddRange(categories);
        await db.SaveChangesAsync();

        var subCategories = new List<Service>
        {
            new() { Name = "General AC Repair", Slug = "general-ac-repair", ParentId = categories[0].Id, Level = 1, Status = true, CreatedAt = DateTime.UtcNow },
            new() { Name = "General Plumbing", Slug = "general-plumbing", ParentId = categories[1].Id, Level = 1, Status = true, CreatedAt = DateTime.UtcNow },
            new() { Name = "General Electrical", Slug = "general-electrical", ParentId = categories[2].Id, Level = 1, Status = true, CreatedAt = DateTime.UtcNow },
            new() { Name = "General Cleaning", Slug = "general-cleaning", ParentId = categories[3].Id, Level = 1, Status = true, CreatedAt = DateTime.UtcNow },
            new() { Name = "General Shifting", Slug = "general-shifting", ParentId = categories[4].Id, Level = 1, Status = true, CreatedAt = DateTime.UtcNow },
            new() { Name = "General Car Care", Slug = "general-car-care", ParentId = categories[5].Id, Level = 1, Status = true, CreatedAt = DateTime.UtcNow },
        };
        db.Services.AddRange(subCategories);
        await db.SaveChangesAsync();

        var subServices = new List<Service>
        {
            // AC
            new() { Name = "AC Basic Wash", Slug = "ac-basic-wash", ParentId = subCategories[0].Id, Level = 2, Status = true, InitialPrice = 500, IsTrending = true, CreatedAt = DateTime.UtcNow },
            new() { Name = "AC Master Wash", Slug = "ac-master-wash", ParentId = subCategories[0].Id, Level = 2, Status = true, InitialPrice = 1000, CreatedAt = DateTime.UtcNow },
            new() { Name = "AC Gas Charge", Slug = "ac-gas-charge", ParentId = subCategories[0].Id, Level = 2, Status = true, InitialPrice = 1500, CreatedAt = DateTime.UtcNow },
            // Plumbing
            new() { Name = "Water Tap Install/Repair", Slug = "water-tap-install", ParentId = subCategories[1].Id, Level = 2, Status = true, InitialPrice = 300, CreatedAt = DateTime.UtcNow },
            new() { Name = "Sink Blockage Remove", Slug = "sink-blockage-remove", ParentId = subCategories[1].Id, Level = 2, Status = true, InitialPrice = 500, IsTrending = true, CreatedAt = DateTime.UtcNow },
            new() { Name = "Water Tank Cleaning", Slug = "water-tank-cleaning", ParentId = subCategories[1].Id, Level = 2, Status = true, InitialPrice = 2000, CreatedAt = DateTime.UtcNow },
            // Electrical
            new() { Name = "Ceiling Fan Repair/Install", Slug = "ceiling-fan-repair", ParentId = subCategories[2].Id, Level = 2, Status = true, InitialPrice = 300, CreatedAt = DateTime.UtcNow },
            new() { Name = "Switch Board Install", Slug = "switch-board-install", ParentId = subCategories[2].Id, Level = 2, Status = true, InitialPrice = 200, CreatedAt = DateTime.UtcNow },
            // Cleaning
            new() { Name = "Sofa Cleaning", Slug = "sofa-cleaning", ParentId = subCategories[3].Id, Level = 2, Status = true, InitialPrice = 300, IsTrending = true, CreatedAt = DateTime.UtcNow },
            new() { Name = "Full Home Deep Cleaning", Slug = "home-deep-cleaning", ParentId = subCategories[3].Id, Level = 2, Status = true, InitialPrice = 3000, CreatedAt = DateTime.UtcNow },
            // Shifting
            new() { Name = "Home Shifting - Inside City", Slug = "home-shifting-city", ParentId = subCategories[4].Id, Level = 2, Status = true, InitialPrice = 5000, CreatedAt = DateTime.UtcNow },
            // Car Care
            new() { Name = "Car Basic Wash", Slug = "car-basic-wash", ParentId = subCategories[5].Id, Level = 2, Status = true, InitialPrice = 400, CreatedAt = DateTime.UtcNow },
        };
        
        db.Services.AddRange(subServices);
        await db.SaveChangesAsync();

        var prices = new List<ServicePrice>
        {
            // AC Prices
            new() { ServiceId = subServices[0].Id, Name = "1 Ton", Price = 500, Status = true, CreatedAt = DateTime.UtcNow },
            new() { ServiceId = subServices[0].Id, Name = "1.5 Ton", Price = 700, Status = true, CreatedAt = DateTime.UtcNow },
            new() { ServiceId = subServices[0].Id, Name = "2 Ton", Price = 1000, Status = true, CreatedAt = DateTime.UtcNow },
            
            new() { ServiceId = subServices[1].Id, Name = "1 Ton", Price = 1000, Status = true, CreatedAt = DateTime.UtcNow },
            new() { ServiceId = subServices[1].Id, Name = "1.5 Ton", Price = 1200, Status = true, CreatedAt = DateTime.UtcNow },
            
            new() { ServiceId = subServices[2].Id, Name = "1 Ton", Price = 1500, Status = true, CreatedAt = DateTime.UtcNow },
            new() { ServiceId = subServices[2].Id, Name = "1.5 Ton", Price = 2000, Status = true, CreatedAt = DateTime.UtcNow },
            
            // Plumbing Prices
            new() { ServiceId = subServices[3].Id, Name = "Standard", Price = 300, Status = true, CreatedAt = DateTime.UtcNow },
            new() { ServiceId = subServices[4].Id, Name = "Standard", Price = 500, Status = true, CreatedAt = DateTime.UtcNow },
            new() { ServiceId = subServices[5].Id, Name = "Up to 1000L", Price = 2000, Status = true, CreatedAt = DateTime.UtcNow },
            new() { ServiceId = subServices[5].Id, Name = "Up to 2000L", Price = 3000, Status = true, CreatedAt = DateTime.UtcNow },
            
            // Electrical Prices
            new() { ServiceId = subServices[6].Id, Name = "Standard", Price = 300, Status = true, CreatedAt = DateTime.UtcNow },
            new() { ServiceId = subServices[7].Id, Name = "Standard", Price = 200, Status = true, CreatedAt = DateTime.UtcNow },
            
            // Cleaning Prices
            new() { ServiceId = subServices[8].Id, Name = "1 Seater", Price = 300, Status = true, CreatedAt = DateTime.UtcNow },
            new() { ServiceId = subServices[8].Id, Name = "2 Seater", Price = 500, Status = true, CreatedAt = DateTime.UtcNow },
            new() { ServiceId = subServices[8].Id, Name = "3 Seater", Price = 700, Status = true, CreatedAt = DateTime.UtcNow },
            new() { ServiceId = subServices[9].Id, Name = "1 BHK", Price = 3000, Status = true, CreatedAt = DateTime.UtcNow },
            new() { ServiceId = subServices[9].Id, Name = "2 BHK", Price = 4500, Status = true, CreatedAt = DateTime.UtcNow },
            new() { ServiceId = subServices[9].Id, Name = "3 BHK", Price = 6000, Status = true, CreatedAt = DateTime.UtcNow },
            
            // Shifting
            new() { ServiceId = subServices[10].Id, Name = "Small Truck", Price = 5000, Status = true, CreatedAt = DateTime.UtcNow },
            new() { ServiceId = subServices[10].Id, Name = "Large Truck", Price = 8000, Status = true, CreatedAt = DateTime.UtcNow },
            
            // Car Care
            new() { ServiceId = subServices[11].Id, Name = "Sedan", Price = 400, Status = true, CreatedAt = DateTime.UtcNow },
            new() { ServiceId = subServices[11].Id, Name = "SUV", Price = 600, Status = true, CreatedAt = DateTime.UtcNow },
        };
        
        db.ServicePrices.AddRange(prices);
        await db.SaveChangesAsync();
        
        // Schedulues for random service
        db.ServiceSchedules.Add(new ServiceSchedule { ServiceId = subServices[0].Id, Day = "Monday", StartTime = "09:00", EndTime = "18:00", Status = true, CreatedAt = DateTime.UtcNow });
        db.ServiceSchedules.Add(new ServiceSchedule { ServiceId = subServices[0].Id, Day = "Tuesday", StartTime = "09:00", EndTime = "18:00", Status = true, CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();
    }

    private static async Task SeedLanguages(AppDbContext db)
    {
        if (await db.Languages.AnyAsync()) return;

        db.Languages.AddRange(
            new Language { Code = "en", Name = "English", NativeName = "English", IsDefault = true, Status = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Language { Code = "bn", Name = "Bengali", NativeName = "বাংলা", IsDefault = false, Status = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });

        await db.SaveChangesAsync();
    }

    private static async Task SeedCustomPages(AppDbContext db)
    {
        // Upsert by Link so an existing page's edited copy is never overwritten.
        var pages = new List<CustomPage>
        {
            new() { Title = "About Us", Slug = "about", Link = "about", Type = "web", Status = true,
                Content = "<p>OneTap Service connects you with verified professionals for home services across Dhaka.</p>" },
            new() { Title = "Privacy Policy", Slug = "privacy", Link = "privacy", Type = "web", Status = true,
                Content = "<p>We collect only the information needed to deliver and support your bookings.</p>" },
            new() { Title = "Terms & Conditions", Slug = "terms", Link = "terms", Type = "web", Status = true,
                Content = "<p>By booking a service you agree to these terms.</p>" },
            new() { Title = "Contact Us", Slug = "contact", Link = "contact", Type = "web", Status = true,
                Content = "<p>Reach our support team any day between 9am and 9pm.</p>" },
        };

        foreach (var page in pages)
        {
            if (await db.CustomPages.AnyAsync(p => p.Link == page.Link)) continue;
            page.CreatedAt = DateTime.UtcNow;
            page.UpdatedAt = DateTime.UtcNow;
            db.CustomPages.Add(page);
        }

        await db.SaveChangesAsync();
    }

    private static async Task SeedBlogCategories(AppDbContext db)
    {
        if (await db.BlogCategories.AnyAsync()) return;
        var categories = new List<BlogCategory>
        {
            new() { Name = "Maintenance Tips", Slug = "maintenance-tips", Status = true, CreatedAt = DateTime.UtcNow },
            new() { Name = "Home Improvement", Slug = "home-improvement", Status = true, CreatedAt = DateTime.UtcNow },
            new() { Name = "Cleaning Hacks", Slug = "cleaning-hacks", Status = true, CreatedAt = DateTime.UtcNow },
            new() { Name = "Safety First", Slug = "safety-first", Status = true, CreatedAt = DateTime.UtcNow },
        };
        db.BlogCategories.AddRange(categories);
        await db.SaveChangesAsync();
    }

    private static async Task SeedBlogs(AppDbContext db)
    {
        if (await db.Blogs.AnyAsync()) return;
        var cats = await db.BlogCategories.ToListAsync();
        if (!cats.Any()) return;

        var blogs = new List<Blog>
        {
            new() { Title = "Top 5 AC Maintenance Tips for Summer", Slug = "ac-maintenance-tips", CategoryId = cats[0].Id, Status = true, CreatedAt = DateTime.UtcNow.AddDays(-10), Content = "Summer is here, meaning your AC will run non-stop. Here are 5 tips to keep it healthy." },
            new() { Title = "Why Deep Cleaning is Essential Every 6 Months", Slug = "deep-cleaning-essential", CategoryId = cats[2].Id, Status = true, CreatedAt = DateTime.UtcNow.AddDays(-15), Content = "A clean home is a healthy home. Learn why deep cleaning is crucial for your family's health." },
            new() { Title = "Signs Your Home Electrical System Needs an Upgrade", Slug = "electrical-system-upgrade", CategoryId = cats[3].Id, Status = true, CreatedAt = DateTime.UtcNow.AddDays(-20), Content = "Flickering lights? Tripping breakers? It might be time to call a professional electrician." },
            new() { Title = "DIY Plumbing Fixes You Should Know", Slug = "diy-plumbing-fixes", CategoryId = cats[1].Id, Status = true, CreatedAt = DateTime.UtcNow.AddDays(-5), Content = "Save money by learning these simple DIY plumbing fixes for common household leaks." },
            new() { Title = "The Ultimate Guide to Moving Homes", Slug = "moving-homes-guide", CategoryId = cats[1].Id, Status = true, CreatedAt = DateTime.UtcNow.AddDays(-2), Content = "Moving can be stressful. Follow our ultimate guide to make your shifting process smooth." },
        };

        db.Blogs.AddRange(blogs);
        await db.SaveChangesAsync();
    }

    private static async Task SeedCoupons(AppDbContext db)
    {
        if (await db.Coupons.AnyAsync()) return;
        var coupons = new List<Coupon>
        {
            new() { Code = "WELCOME10", DiscountType = "percentage", Discount = 10, MinimumPurchase = 500, Status = true, EndDate = DateTime.UtcNow.AddMonths(1), CreatedAt = DateTime.UtcNow },
            new() { Code = "FLAT100", DiscountType = "amount", Discount = 100, MinimumPurchase = 1000, Status = true, EndDate = DateTime.UtcNow.AddMonths(1), CreatedAt = DateTime.UtcNow },
            new() { Code = "SUMMER20", DiscountType = "percentage", Discount = 20, MaxDiscount = 500, MinimumPurchase = 1500, Status = true, EndDate = DateTime.UtcNow.AddMonths(3), CreatedAt = DateTime.UtcNow },
        };
        db.Coupons.AddRange(coupons);
        await db.SaveChangesAsync();
    }

    private static async Task SeedSliders(AppDbContext db)
    {
        // Repair rows seeded before images were CDN URLs: a bare filename like
        // "slider-ac.jpg" resolves to nothing and renders as a broken image.
        var legacy = await db.Sliders
            .Where(s => s.Image != null && s.Image != "" && !s.Image.StartsWith("http") && !s.Image.StartsWith("/"))
            .ToListAsync();
        if (legacy.Count > 0)
        {
            foreach (var slider in legacy)
                slider.Image = "https://lcst.sgp1.cdn.digitaloceanspaces.com/Onetap/web/service-banners/banner_cleaning.png";
            await db.SaveChangesAsync();
        }

        if (await db.Sliders.AnyAsync()) return;
        var sliders = new List<Slider>
        {
            new() { Title = "Summer Cooling Deals", SubTitle = "Up to 20% off on AC Servicing", Image = "https://lcst.sgp1.cdn.digitaloceanspaces.com/Onetap/web/service-banners/banner_electrical_checkup.png", Link = "/services/ac-servicing", Status = true, Position = 1, CreatedAt = DateTime.UtcNow },
            new() { Title = "Revitalize Your Home", SubTitle = "Professional Deep Cleaning Services", Image = "https://lcst.sgp1.cdn.digitaloceanspaces.com/Onetap/web/service-banners/banner_cleaning.png", Link = "/services/deep-cleaning", Status = true, Position = 2, CreatedAt = DateTime.UtcNow },
            new() { Title = "Expert Electricians at Your Door", SubTitle = "Safe & Reliable Repairs", Image = "https://lcst.sgp1.cdn.digitaloceanspaces.com/Onetap/web/service-banners/banner_painting.png", Link = "/services/electrical-repairs", Status = true, Position = 3, CreatedAt = DateTime.UtcNow },
        };
        db.Sliders.AddRange(sliders);
        await db.SaveChangesAsync();
    }

    private static async Task SeedUsersAndVendors(AppDbContext db)
    {
        // 4 Vendors
        var vendorData = new List<(string Name, string Email, string Phone, double Rate, string Address, string Type)>
        {
            ("Quick Fix Services", "vendor1@oneweb.com", "01711111111", 10, "Mirpur, Dhaka", "Individual"),
            ("Dhaka Cleaning Co", "vendor2@oneweb.com", "01711111112", 15, "Banani, Dhaka", "Company"),
            ("Pro Plumbers", "vendor3@oneweb.com", "01711111113", 10, "Gulshan, Dhaka", "Company"),
            ("ElectroMasters", "vendor4@oneweb.com", "01711111114", 12, "Dhanmondi, Dhaka", "Individual")
        };

        foreach (var v in vendorData)
        {
            if (!await db.Users.AnyAsync(u => u.Email == v.Email))
            {
                var user = new User { Name = v.Name, Email = v.Email, Phone = v.Phone, Password = BCrypt.Net.BCrypt.HashPassword("Pass123!"), UserType = "vendor", Status = true, IsApproved = true, CreatedAt = DateTime.UtcNow };
                db.Users.Add(user);
                await db.SaveChangesAsync();
                
                db.Vendors.Add(new Vendor { UserId = user.Id, CommissionRate = v.Rate, Address = v.Address, Type = v.Type, TotalEarnings = 0, Status = true, CreatedAt = DateTime.UtcNow });
                await db.SaveChangesAsync();
            }
        }

        // 4 Customers
        var customerData = new List<(string Name, string Email, string Phone)>
        {
            ("Abir Ahmed", "customer1@oneweb.com", "01822222221"),
            ("Sadia Islam", "customer2@oneweb.com", "01822222222"),
            ("John Doe", "customer3@oneweb.com", "01822222223"),
            ("Jane Smith", "customer4@oneweb.com", "01822222224")
        };

        foreach (var c in customerData)
        {
            if (!await db.Users.AnyAsync(u => u.Email == c.Email))
            {
                var user = new User { Name = c.Name, Email = c.Email, Phone = c.Phone, Password = BCrypt.Net.BCrypt.HashPassword("Pass123!"), UserType = "customer", Status = true, IsApproved = true, CreatedAt = DateTime.UtcNow };
                db.Users.Add(user);
                await db.SaveChangesAsync();
                
                // Add address and fcm token for customers
                db.Addresses.Add(new Address { UserId = user.Id, StreetAddress = "Test Address for " + c.Name, CityId = 1, CreatedAt = DateTime.UtcNow });
                db.FcmTokens.Add(new FcmToken { UserId = user.Id, Token = "fcm_token_" + user.Id, DeviceType = "android", CreatedAt = DateTime.UtcNow });
            }
        }

        // 1 Staff
        if (!await db.Users.AnyAsync(u => u.Email == "staff@oneweb.com"))
        {
            db.Users.Add(new User { Name = "System Staff", Email = "staff@oneweb.com", Phone = "01933333333", Password = BCrypt.Net.BCrypt.HashPassword("Pass123!"), UserType = "staff", Status = true, IsApproved = true, CreatedAt = DateTime.UtcNow });
        }
        
        await db.SaveChangesAsync();
    }

    private static async Task SeedVendorServices(AppDbContext db)
    {
        if (await db.VendorServices.AnyAsync()) return;

        var vendors = await db.Vendors.ToListAsync();
        var services = await db.Services.Where(s => s.Level > 0).ToListAsync();

        if (vendors.Count < 4 || services.Count < 10) return;

        // Vendor 1 (Quick Fix) -> AC & Appliances
        db.VendorServices.Add(new VendorService { VendorId = vendors[0].Id, ServiceId = services[0].Id, CreatedAt = DateTime.UtcNow }); // AC Wash
        db.VendorServices.Add(new VendorService { VendorId = vendors[0].Id, ServiceId = services[1].Id, CreatedAt = DateTime.UtcNow }); // AC Master Wash
        db.VendorServices.Add(new VendorService { VendorId = vendors[0].Id, ServiceId = services[2].Id, CreatedAt = DateTime.UtcNow }); // AC Gas

        // Vendor 2 (Cleaning Co) -> Cleaning
        db.VendorServices.Add(new VendorService { VendorId = vendors[1].Id, ServiceId = services[8].Id, CreatedAt = DateTime.UtcNow }); // Sofa Cleaning
        db.VendorServices.Add(new VendorService { VendorId = vendors[1].Id, ServiceId = services[9].Id, CreatedAt = DateTime.UtcNow }); // Home Deep Cleaning
        db.VendorServices.Add(new VendorService { VendorId = vendors[1].Id, ServiceId = services[5].Id, CreatedAt = DateTime.UtcNow }); // Tank Cleaning

        // Vendor 3 (Plumbers) -> Plumbing
        db.VendorServices.Add(new VendorService { VendorId = vendors[2].Id, ServiceId = services[3].Id, CreatedAt = DateTime.UtcNow }); // Water Tap
        db.VendorServices.Add(new VendorService { VendorId = vendors[2].Id, ServiceId = services[4].Id, CreatedAt = DateTime.UtcNow }); // Sink
        
        // Vendor 4 (ElectroMasters) -> Electrical
        db.VendorServices.Add(new VendorService { VendorId = vendors[3].Id, ServiceId = services[6].Id, CreatedAt = DateTime.UtcNow }); // Fan
        db.VendorServices.Add(new VendorService { VendorId = vendors[3].Id, ServiceId = services[7].Id, CreatedAt = DateTime.UtcNow }); // Switch

        await db.SaveChangesAsync();
    }

    private static async Task SeedOrdersAndRelated(AppDbContext db)
    {
        if (await db.Orders.AnyAsync()) return;

        var customers = await db.Users.Where(u => u.UserType == "customer").ToListAsync();
        var vendorServices = await db.VendorServices.Include(vs => vs.Service).Include(vs => vs.Vendor).ToListAsync();
        var coupon = await db.Coupons.FirstOrDefaultAsync();

        if (!customers.Any() || !vendorServices.Any()) return;

        var random = new Random(42);
        var statuses = new[] { "pending", "confirmed", "assigned", "on_the_way", "in_progress", "completed", "cancelled" };

        for (int i = 1; i <= 15; i++)
        {
            var customer = customers[random.Next(customers.Count)];
            var vs = vendorServices[random.Next(vendorServices.Count)];
            var status = statuses[random.Next(statuses.Length)];
            var paymentStatus = status == "completed" ? "paid" : "unpaid";
            var paymentType = random.Next(2) == 0 ? "cod" : "sslcommerz";
            
            var createdDaysAgo = random.Next(1, 30);
            var createdAt = DateTime.UtcNow.AddDays(-createdDaysAgo);
            
            double initialPrice = vs.Service.InitialPrice > 0 ? vs.Service.InitialPrice : 500;
            double discount = i % 5 == 0 && coupon != null ? 100 : 0;
            double total = initialPrice - discount;

            var order = new Order
            {
                UserId = customer.Id,
                VendorId = status == "pending" ? null : vs.VendorId,
                ServiceId = vs.ServiceId,
                ShippingAddress = $"House {i}, Road {random.Next(1, 10)}, Block C, Dhaka",
                DeliveryStatus = status,
                PaymentType = paymentType,
                PaymentStatus = paymentStatus,
                GrandTotal = total,
                CouponDiscount = discount,
                Code = coupon != null && discount > 0 ? coupon.Code : null,
                OrderFrom = random.Next(2) == 0 ? "web" : "app",
                CreatedAt = createdAt,
                UpdatedAt = createdAt.AddHours(2),
                TrackingCode = $"TRK-{DateTime.UtcNow.Year}-{1000 + i}",
                Detail = new OrderDetail
                {
                    ServiceId = vs.ServiceId,
                    Price = initialPrice,
                    CouponCode = coupon != null && discount > 0 ? coupon.Code : null,
                    CouponDiscount = discount,
                    CreatedAt = createdAt
                }
            };

            db.Orders.Add(order);
            await db.SaveChangesAsync();

            // Additional logic for specific statuses
            if (status == "completed")
            {
                // Rating
                db.Ratings.Add(new Rating { UserId = customer.Id, VendorId = vs.VendorId, OrderId = order.Id, RatingValue = 4 + random.NextDouble(), Review = "Very good service, recommended!", Status = true, CreatedAt = createdAt.AddDays(1) });
                
                // Payment record
                db.Payments.Add(new Payment { UserId = customer.Id, OrderId = order.Id, Amount = total, PaymentMethod = paymentType, Status = "completed", TransactionId = "TRX" + random.Next(100000, 999999), CreatedAt = createdAt.AddHours(1) });
                
                // Commission History
                double adminComm = total * 0.15;
                db.CommissionHistories.Add(new CommissionHistory { VendorId = vs.VendorId, OrderId = order.Id, CommissionAmount = adminComm, VendorAmount = total - adminComm, AdminAmount = adminComm, CreatedAt = createdAt.AddHours(2) });
                
                // Update Vendor Earnings
                vs.Vendor.TotalEarnings += (total - adminComm);
                vs.Vendor.Balance += (total - adminComm);
                db.Vendors.Update(vs.Vendor);
            }

            if (discount > 0 && coupon != null)
            {
                db.CouponUsages.Add(new CouponUsage { CouponId = coupon.Id, UserId = customer.Id, OrderId = order.Id, CreatedAt = createdAt });
                coupon.UsedCount += 1;
                db.Coupons.Update(coupon);
            }

            db.Notifications.Add(new Notification { UserId = customer.Id, Title = "Order Status Update", Description = $"Your order {order.TrackingCode} is now {status}.", Type = "order", IsRead = false, CreatedAt = createdAt.AddMinutes(30) });
        }
        
        await db.SaveChangesAsync();

        // 8. SupportTickets
        db.SupportTickets.Add(new SupportTicket { UserId = customers[0].Id, Subject = "Booking Issue", Message = "I need to reschedule my booking.", Status = "open", CreatedAt = DateTime.UtcNow.AddDays(-1) });
        db.SupportTickets.Add(new SupportTicket { UserId = customers[1].Id, Subject = "Refund Request", Message = "Service was cancelled, need refund.", Status = "replied", CreatedAt = DateTime.UtcNow.AddDays(-3) });
        
        // 9. VendorWithdrawRequests
        db.VendorWithdrawRequests.Add(new VendorWithdrawRequest { VendorId = vendorServices[0].VendorId, Amount = 1500, PaymentMethod = "Bank Transfer", AccountNumber = "1234567890", Status = "pending", CreatedAt = DateTime.UtcNow.AddDays(-1) });
        
        // 11. Uploads
        db.Uploads.Add(new Upload { FileName = "sample-service.png", FilePath = "/uploads/sample-service.png", FileType = "image/png", FileSize = 2048, CreatedAt = DateTime.UtcNow });

        await db.SaveChangesAsync();
    }
}
