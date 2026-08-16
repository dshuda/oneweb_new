# OneWeb — Micro Task Prompts for Nemotron 3 Super Free
# Run tasks IN ORDER. Complete one before starting next.
# Copy-paste each TASK PROMPT block into OpenCode.

---

## HOW TO USE
1. Open OpenCode → Select Nemotron 3 Super Free
2. Copy ONE task prompt at a time
3. Wait for completion
4. Then copy next task
5. NEVER skip a task

## PROJECT CONTEXT (Read Once)
- Project: OneWeb — Home service marketplace (Bangladesh)
- Backend: ASP.NET Core 8, C#, EF Core 8, PostgreSQL 16
- Frontend: Next.js 14 App Router
- Internal: gRPC (proto3)
- Auth: JWT Bearer + Refresh Token
- Cache: Redis
- Root folder: D:\OneWeb\

---

# ════════════════════════════════════════
# PHASE 1 — PROJECT STRUCTURE & SETUP
# ════════════════════════════════════════

---

## TASK 1.1 — Create Solution Structure

```
ROLE: You are a senior .NET architect.

TASK: Create the OneWeb solution folder structure and project files.

CREATE the following using dotnet CLI commands (give me the exact commands to run):

Solution: OneWeb.sln

Projects inside /src/:
1. OneWeb.Api          → ASP.NET Core 8 Web API
2. OneWeb.Application  → Class Library
3. OneWeb.Domain       → Class Library
4. OneWeb.Infrastructure → Class Library
5. OneWeb.GrpcServices → ASP.NET Core 8 (for gRPC)

Project References:
- OneWeb.Api → references OneWeb.Application, OneWeb.Infrastructure
- OneWeb.Application → references OneWeb.Domain
- OneWeb.Infrastructure → references OneWeb.Application, OneWeb.Domain
- OneWeb.GrpcServices → references OneWeb.Application

NuGet packages to install per project:

OneWeb.Api:
- Microsoft.AspNetCore.Authentication.JwtBearer
- Swashbuckle.AspNetCore
- StackExchange.Redis

OneWeb.Application:
- MediatR
- FluentValidation
- FluentValidation.DependencyInjectionExtensions
- AutoMapper

OneWeb.Infrastructure:
- Npgsql.EntityFrameworkCore.PostgreSQL
- EFCore.NamingConventions
- StackExchange.Redis
- FirebaseAdmin

OneWeb.GrpcServices:
- Grpc.AspNetCore

OUTPUT: Give me exact dotnet CLI commands to run in sequence.
Root folder: D:\OneWeb\
```

---

## TASK 1.2 — Domain Entities Part 1 (User, Vendor, Address)

```
ROLE: You are a senior C# developer.

PROJECT: OneWeb — ASP.NET Core 8, PostgreSQL 16, EF Core 8

TASK: Create domain entity classes in OneWeb.Domain/Entities/

CREATE these files with FULL code:

FILE 1: OneWeb.Domain/Entities/User.cs
Properties:
- Id (long)
- Name (string?)
- Email (string?)
- EmailVerifiedAt (DateTime?)
- VerificationCode (string?)
- CountryCode (string?)
- Phone (string?)
- Gender (string?)
- Dob (string?)
- BloodGroup (string?)
- FcmId (string?)
- DeviceVersion (string?)
- UserType (string?) — values: "admin", "vendor", "customer"
- AssignVendorId (int?)
- ImageId (string?)
- Address (string?)
- Latitude (string?)
- Longitude (string?)
- Status (bool) default true
- IsApproved (bool) default false
- IsBanned (bool) default false
- Password (string?)
- DeletedAt (DateTime?)
- CreatedAt (DateTime?)
- UpdatedAt (DateTime?)
- Navigation: ICollection<Order> Orders
- Navigation: ICollection<Address> Addresses
- Navigation: ICollection<Rating> Ratings
- Navigation: Vendor? Vendor

FILE 2: OneWeb.Domain/Entities/Vendor.cs
Properties:
- Id (long)
- UserId (int)
- ServiceId (string?) — comma separated service ids
- CommissionRate (double) default 0
- PendingBalance (double) default 0
- Balance (double) default 0
- TotalEarnings (double) default 0
- Type (string?)
- CashPaymentStatus (int?)
- MobilePaymentStatus (bool) default false
- BankPaymentStatus (int?)
- BankName (string?)
- BankAccountName (string?)
- BankAccountNumber (string?)
- BankRoutingNumber (string?)
- Division (int?)
- District (int?)
- Address (string?)
- ShortBiography (string?)
- Cv (string?)
- Nid (string?)
- TinNumber (string?)
- BinNumber (string?)
- TradeLicense (string?)
- AcademicCertificate (string?)
- WorkExperience (string?)
- Status (bool) default true
- CreatedAt (DateTime?)
- UpdatedAt (DateTime?)
- Navigation: User User

FILE 3: OneWeb.Domain/Entities/Address.cs
Properties:
- Id (long)
- UserId (int?)
- Address (string?)
- CountryId (int?)
- StateId (int?)
- CityId (int?)
- CreatedAt (DateTime?)
- UpdatedAt (DateTime?)
- Navigation: User? User

FILE 4: OneWeb.Domain/Entities/FcmToken.cs
Properties:
- Id (long)
- UserId (long)
- Token (string)
- DeviceType (string?) — "android" or "ios"
- CreatedAt (DateTime?)
- UpdatedAt (DateTime?)

RULES:
- All entities inherit from BaseEntity (create BaseEntity with Id, CreatedAt, UpdatedAt)
- Use nullable reference types
- No data annotations — configure in EF Core Fluent API later
- Namespace: OneWeb.Domain.Entities
```

---

## TASK 1.3 — Domain Entities Part 2 (Service, Order, Payment)

```
ROLE: You are a senior C# developer.

PROJECT: OneWeb — ASP.NET Core 8, PostgreSQL 16, EF Core 8
Namespace: OneWeb.Domain.Entities
Base class: BaseEntity (has Id long, CreatedAt DateTime?, UpdatedAt DateTime?)

TASK: Create domain entity classes.

FILE 1: OneWeb.Domain/Entities/Service.cs
Properties:
- Id (long)
- Name (string)
- Slug (string?)
- ParentId (int) default 0 — 0 means top category
- Level (int) default 0 — 0=category, 1=subcategory, 2=bookable leaf
- CommissionRate (double) default 0
- ServiceIcon (string?)
- BannerImage (string?)
- InitialPrice (double) default 0
- About (string?) — HTML content
- ServiceQuality (string?) — HTML content
- MetaTitle (string?)
- MetaKeywords (string?)
- MetaDescription (string?)
- IsTrending (bool) default false
- Status (bool) default true
- CreatedBy (int)
- Navigation: ICollection<ServicePrice> Prices
- Navigation: ICollection<ServiceSchedule> Schedules
- Navigation: ICollection<Order> Orders

FILE 2: OneWeb.Domain/Entities/ServicePrice.cs
Properties:
- Id (long)
- ServiceId (long)
- Name (string?)
- Price (double) default 0
- Status (bool) default true
- CreatedAt (DateTime?)
- UpdatedAt (DateTime?)
- Navigation: Service Service

FILE 3: OneWeb.Domain/Entities/ServiceSchedule.cs
Properties:
- Id (long)
- ServiceId (long)
- Day (string?) — e.g. "Monday"
- StartTime (string?)
- EndTime (string?)
- Status (bool) default true
- CreatedAt (DateTime?)
- UpdatedAt (DateTime?)
- Navigation: Service Service

FILE 4: OneWeb.Domain/Entities/Order.cs
Properties:
- Id (long)
- UserId (int?)
- VendorId (int?)
- ServiceId (int?)
- AssignResourceId (int?)
- ShippingAddress (string?)
- AdditionalInfo (string?)
- ShippingType (string?)
- OrderFrom (string) default "app"
- DeliveryStatus (string) default "pending"
  — values: pending, confirmed, assigned, on_the_way, in_progress, completed, cancelled
- DeliverStatusJson (string?) — JSON history
- PaymentType (string?) — cod, bkash, nagad, rocket
- PaymentStatus (string) default "unpaid" — unpaid, paid
- PaymentDetails (string?)
- GrandTotal (double?)
- CouponDiscount (double) default 0
- Code (string?)
- TrackingCode (string?)
- Date (int?) — unix timestamp
- Viewed (int) default 0
- DeliveryViewed (int) default 1
- PaymentStatusViewed (int) default 1
- CommissionCalculated (int) default 0
- IsCancelled (int) default 0
- BeforePic (int?)
- AfterPic (int?)
- Latitude (string?)
- Longitude (string?)
- CreatedAt (DateTime?)
- UpdatedAt (DateTime?)
- Navigation: User? User
- Navigation: OrderDetail? Detail
- Navigation: Payment? Payment
- Navigation: Rating? Rating

FILE 5: OneWeb.Domain/Entities/OrderDetail.cs
Properties:
- Id (long)
- OrderId (long)
- ServiceId (int?)
- Price (double?)
- Tax (double?)
- DeliveryCharge (double?) default 0
- CouponCode (string?)
- CouponDiscount (double?) default 0
- CreatedAt (DateTime?)
- UpdatedAt (DateTime?)
- Navigation: Order Order

FILE 6: OneWeb.Domain/Entities/Payment.cs
Properties:
- Id (long)
- UserId (int?)
- OrderId (long?)
- Amount (double?)
- TransactionId (string?)
- PaymentMethod (string?) — cod, bkash, nagad, rocket
- Status (string?) — pending, completed, failed
- CreatedAt (DateTime?)
- UpdatedAt (DateTime?)
- Navigation: Order? Order

FILE 7: OneWeb.Domain/Entities/Rating.cs
Properties:
- Id (long)
- UserId (int?)
- VendorId (int?)
- OrderId (long?)
- Rating (double?) default 0
- Review (string?)
- Status (bool) default true
- CreatedAt (DateTime?)
- UpdatedAt (DateTime?)
- Navigation: User? User
- Navigation: Order? Order
```

---

## TASK 1.4 — Domain Entities Part 3 (CMS, Location, Settings)

```
ROLE: You are a senior C# developer.

PROJECT: OneWeb — ASP.NET Core 8
Namespace: OneWeb.Domain.Entities

TASK: Create remaining domain entity classes.

FILE 1: OneWeb.Domain/Entities/Division.cs
- Id (long), Name (string), BnName (string?), Status (bool) default true

FILE 2: OneWeb.Domain/Entities/District.cs
- Id (long), DivisionId (int), Name (string), BnName (string?),
  Lat (string?), Long (string?), Status (bool) default true
- Navigation: Division Division

FILE 3: OneWeb.Domain/Entities/Upazila.cs
- Id (long), DistrictId (int), Name (string), BnName (string?),
  Status (bool) default true
- Navigation: District District

FILE 4: OneWeb.Domain/Entities/BusinessSetting.cs
- Id (long), Type (string), Value (string?), Lang (string?),
  CreatedAt (DateTime?), UpdatedAt (DateTime?)

FILE 5: OneWeb.Domain/Entities/Slider.cs
- Id (long), Title (string?), PhotoId (int?), Link (string?),
  Status (bool) default true, CreatedAt (DateTime?), UpdatedAt (DateTime?)

FILE 6: OneWeb.Domain/Entities/Blog.cs
- Id (long), Title (string), Slug (string), CategoryId (int),
  Content (string), AppContent (string?), Image (string?),
  Status (bool) default false, MetaKeywords (string?),
  MetaDescription (string?), CreatedAt (DateTime?), UpdatedAt (DateTime?)
- Navigation: ICollection<BlogTranslation> Translations

FILE 7: OneWeb.Domain/Entities/BlogTranslation.cs
- Id (long), Lang (string?), BlogId (long), Title (string),
  Content (string), AppContent (string?),
  CreatedAt (DateTime?), UpdatedAt (DateTime?)
- Navigation: Blog Blog

FILE 8: OneWeb.Domain/Entities/Coupon.cs
- Id (long), Code (string), Discount (double), DiscountType (string?),
  MinimumPurchase (double?) default 0, MaxDiscount (double?),
  StartDate (DateTime?), EndDate (DateTime?),
  UsageLimit (int?) default 0, UsedCount (int) default 0,
  Status (bool) default true, CreatedAt (DateTime?), UpdatedAt (DateTime?)

FILE 9: OneWeb.Domain/Entities/Notification.cs
- Id (long), UserId (long?), Title (string?), Description (string?),
  Image (string?), Type (string?), IsRead (bool) default false,
  CreatedAt (DateTime?), UpdatedAt (DateTime?)

FILE 10: OneWeb.Domain/Entities/SupportTicket.cs
- Id (long), UserId (int?), Subject (string?), Message (string?),
  Status (string?) default "open" — open, replied, closed,
  CreatedAt (DateTime?), UpdatedAt (DateTime?)
- Navigation: User? User

FILE 11: OneWeb.Domain/Entities/VendorWithdrawRequest.cs
- Id (long), VendorId (int), Amount (double), PaymentMethod (string?),
  AccountNumber (string?), Status (string?) default "pending",
  Note (string?), CreatedAt (DateTime?), UpdatedAt (DateTime?)
- Navigation: Vendor Vendor

FILE 12: OneWeb.Domain/Entities/CommissionHistory.cs
- Id (long), VendorId (int), OrderId (long), CommissionAmount (double),
  VendorAmount (double), AdminAmount (double),
  CreatedAt (DateTime?), UpdatedAt (DateTime?)

FILE 13: OneWeb.Domain/Entities/Upload.cs
- Id (long), FileName (string?), FilePath (string?),
  FileType (string?), FileSize (long?),
  CreatedAt (DateTime?), UpdatedAt (DateTime?)
```

---

## TASK 1.5 — EF Core DbContext & Configurations

```
ROLE: You are a senior .NET EF Core developer.

PROJECT: OneWeb — EF Core 8, PostgreSQL 16, Npgsql
All entities are in OneWeb.Domain.Entities namespace.
Naming convention: snake_case (UseSnakeCaseNamingConvention)

TASK: Create AppDbContext and entity configurations.

FILE 1: OneWeb.Infrastructure/Persistence/AppDbContext.cs

Create AppDbContext : DbContext with DbSet for ALL entities:
- Users, Vendors, Addresses, FcmTokens
- Services, ServicePrices, ServiceSchedules
- Orders, OrderDetails, Payments, Ratings
- Divisions, Districts, Upazilas
- BusinessSettings, Sliders, Blogs, BlogTranslations
- Coupons, Notifications, SupportTickets
- VendorWithdrawRequests, CommissionHistories
- Uploads

Override OnModelCreating → call each IEntityTypeConfiguration

FILE 2: OneWeb.Infrastructure/Persistence/Configurations/UserConfiguration.cs
Implement IEntityTypeConfiguration<User>:
- Table name: "users"
- PK: Id
- Email: max 255, unique index
- Phone: max 50, index
- UserType: max 50
- Status, IsApproved, IsBanned: HasDefaultValue(true/false)
- HasMany Orders with FK UserId
- HasMany Addresses with FK UserId
- HasOne Vendor

FILE 3: OneWeb.Infrastructure/Persistence/Configurations/ServiceConfiguration.cs
Implement IEntityTypeConfiguration<Service>:
- Table: "services"
- Name: required, max 255
- Slug: max 255, unique index
- About: column type "text"
- ServiceQuality: column type "text"
- Index on (ParentId, Level, Status)

FILE 4: OneWeb.Infrastructure/Persistence/Configurations/OrderConfiguration.cs
Implement IEntityTypeConfiguration<Order>:
- Table: "orders"
- DeliveryStatus: max 50, HasDefaultValue("pending")
- PaymentStatus: max 50, HasDefaultValue("unpaid")
- OrderFrom: HasDefaultValue("app")
- DeliverStatusJson: column type "jsonb"
- IsCancelled: HasDefaultValue(0)
- Index on UserId, VendorId, DeliveryStatus separately

FILE 5: OneWeb.Infrastructure/Persistence/Configurations/VendorConfiguration.cs
Implement IEntityTypeConfiguration<Vendor>:
- Table: "vendors"
- Balance, PendingBalance, TotalEarnings: HasDefaultValue(0.0)
- HasOne User with FK UserId

ALSO CREATE: OneWeb.Infrastructure/Persistence/Configurations/
Create simple configurations (table name + PK only) for:
- AddressConfiguration, FcmTokenConfiguration
- ServicePriceConfiguration, ServiceScheduleConfiguration
- OrderDetailConfiguration, PaymentConfiguration, RatingConfiguration
- DivisionConfiguration, DistrictConfiguration, UpazilaConfiguration
- BusinessSettingConfiguration, SliderConfiguration
- BlogConfiguration, BlogTranslationConfiguration
- CouponConfiguration, NotificationConfiguration
- SupportTicketConfiguration, VendorWithdrawRequestConfiguration
- CommissionHistoryConfiguration, UploadConfiguration

RULES:
- Every config: explicit table name (snake_case plural)
- No data annotations on entities
- Use HasColumnType("text") for all HTML/long text fields
```

---

## TASK 1.6 — Infrastructure DI & Database Migration Setup

```
ROLE: You are a senior .NET developer.

PROJECT: OneWeb — ASP.NET Core 8, EF Core 8, PostgreSQL 16

TASK: Setup dependency injection and database configuration.

FILE 1: OneWeb.Infrastructure/DependencyInjection.cs
Create static class with AddInfrastructure(this IServiceCollection services, IConfiguration config):
- AddDbContext<AppDbContext> with UseNpgsql + UseSnakeCaseNamingConvention
- ConnectionString from config["ConnectionStrings:Default"]
- Add Redis: services.AddStackExchangeRedisCache(...)
  RedisConnectionString from config["Redis:ConnectionString"]

FILE 2: OneWeb.Api/appsettings.json
```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Database=oneweb;Username=postgres;Password=postgres"
  },
  "Redis": {
    "ConnectionString": "localhost:6379"
  },
  "Jwt": {
    "SecretKey": "YourSuperSecretKeyHereMinimum32Characters!",
    "Issuer": "OneWeb",
    "Audience": "OneWebUsers",
    "AccessTokenExpiryMinutes": 15,
    "RefreshTokenExpiryDays": 7
  },
  "Sms": {
    "Provider": "sslwireless",
    "ApiKey": "",
    "SenderId": "OneWeb"
  },
  "Firebase": {
    "CredentialsPath": "firebase-credentials.json"
  }
}
```

FILE 3: OneWeb.Api/Program.cs
Full Program.cs with:
- builder.Services.AddInfrastructure(builder.Configuration)
- builder.Services.AddControllers()
- builder.Services.AddEndpointsApiExplorer()
- builder.Services.AddSwaggerGen() with JWT Bearer support
- builder.Services.AddMediatR(typeof(ApplicationAssemblyMarker))
- builder.Services.AddAutoMapper(typeof(ApplicationAssemblyMarker))
- builder.Services.AddAuthentication JwtBearer
  (read SecretKey, Issuer, Audience from config)
- app.UseAuthentication(), app.UseAuthorization()
- app.MapControllers()
- In development: app.UseSwagger(), app.UseSwaggerUI()

FILE 4: Give me exact terminal commands to:
1. Add EF Core migration named "InitialCreate"
2. Update database
Run from: D:\OneWeb\src\OneWeb.Infrastructure\
```

---

# ════════════════════════════════════════
# PHASE 2 — AUTH MODULE
# ════════════════════════════════════════

---

## TASK 2.1 — JWT & Token Service

```
ROLE: You are a senior C# security developer.

PROJECT: OneWeb — ASP.NET Core 8
Config values come from appsettings.json Jwt section:
- SecretKey, Issuer, Audience, AccessTokenExpiryMinutes, RefreshTokenExpiryDays

TASK: Create JWT token service.

FILE 1: OneWeb.Domain/Interfaces/ITokenService.cs
```csharp
public interface ITokenService
{
    string GenerateAccessToken(long userId, string userType, string? phone);
    string GenerateRefreshToken();
    long? ValidateRefreshToken(string token);
}
```

FILE 2: OneWeb.Infrastructure/Services/TokenService.cs
Implement ITokenService:
- GenerateAccessToken:
  Claims: sub (userId), role (userType), phone, jti (Guid)
  Sign with SymmetricSecurityKey + HmacSha256
  Expiry: AccessTokenExpiryMinutes from config
- GenerateRefreshToken: return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64))
- ValidateRefreshToken: (will be implemented with Redis storage — return null for now)

FILE 3: OneWeb.Infrastructure/Services/RefreshTokenService.cs
Store refresh tokens in Redis:
- Key pattern: "refresh_token:{userId}:{token_hash}"
- Methods:
  - Task SaveRefreshTokenAsync(long userId, string token)
    → store in Redis with TTL = RefreshTokenExpiryDays
  - Task<bool> ValidateAndRevokeAsync(long userId, string token)
    → check exists in Redis → delete → return true/false
  - Task RevokeAllUserTokensAsync(long userId)
    → delete all keys matching "refresh_token:{userId}:*"

Register both in OneWeb.Infrastructure/DependencyInjection.cs as Scoped.
```

---

## TASK 2.2 — OTP Service & SMS

```
ROLE: You are a senior C# developer.

PROJECT: OneWeb — ASP.NET Core 8, Redis

TASK: Create OTP service with Redis storage.

FILE 1: OneWeb.Domain/Interfaces/IOtpService.cs
```csharp
public interface IOtpService
{
    Task<string> GenerateAndSaveOtpAsync(string phone);
    Task<bool> ValidateOtpAsync(string phone, string otp);
}
```

FILE 2: OneWeb.Infrastructure/Services/OtpService.cs
Implement IOtpService:
- GenerateAndSaveOtpAsync:
  → Generate 6-digit OTP: Random.Shared.Next(100000, 999999).ToString()
  → Save in Redis: Key="otp:{phone}", Value=otp, TTL=5 minutes
  → Return the OTP
- ValidateOtpAsync:
  → Get from Redis key "otp:{phone}"
  → Compare (case insensitive)
  → If valid: delete from Redis, return true
  → Else: return false

FILE 3: OneWeb.Domain/Interfaces/ISmsService.cs
```csharp
public interface ISmsService
{
    Task<bool> SendOtpAsync(string phoneNumber, string otp);
}
```

FILE 4: OneWeb.Infrastructure/Services/SmsService.cs
Implement ISmsService (SSL Wireless gateway):
- HTTP POST to: https://sms.sslwireless.com/pushapi/dynamic/server.php
- Params: api_token, sid (senderId), msisdn (phone), sms ("Your OTP: {otp}"), csmsid (Guid)
- Read ApiKey and SenderId from IConfiguration["Sms:ApiKey"] and ["Sms:SenderId"]
- Use IHttpClientFactory
- Return true if HTTP 200, else false
- Log errors with ILogger

Register in DependencyInjection.cs:
- services.AddScoped<IOtpService, OtpService>()
- services.AddScoped<ISmsService, SmsService>()
- services.AddHttpClient<ISmsService, SmsService>()
```

---

## TASK 2.3 — Auth Commands & Handlers (MediatR)

```
ROLE: You are a senior C# CQRS developer using MediatR.

PROJECT: OneWeb — ASP.NET Core 8, MediatR, EF Core 8, PostgreSQL

TASK: Create Auth feature with MediatR Commands.

FOLDER: OneWeb.Application/Features/Auth/

FILE 1: Commands/SendOtpCommand.cs
```csharp
public record SendOtpCommand(string Phone) : IRequest<SendOtpResult>;
public record SendOtpResult(bool Success, string Message);
```

FILE 2: Commands/SendOtpCommandHandler.cs
Handler for SendOtpCommand:
- Validate phone: must be 11 digits starting with 01
- Call IOtpService.GenerateAndSaveOtpAsync(phone)
- Call ISmsService.SendOtpAsync(phone, otp)
- Return SendOtpResult(true, "OTP sent successfully")
- On error: return SendOtpResult(false, error message)

FILE 3: Commands/VerifyOtpCommand.cs
```csharp
public record VerifyOtpCommand(string Phone, string Otp) : IRequest<AuthResult>;
public record AuthResult(bool Success, string? AccessToken,
    string? RefreshToken, string? UserType, string? Message);
```

FILE 4: Commands/VerifyOtpCommandHandler.cs
Handler:
- Call IOtpService.ValidateOtpAsync(phone, otp)
- If invalid: return AuthResult(false, null, null, null, "Invalid OTP")
- Find user by phone in DB (AppDbContext)
- If not found: CREATE new user
  new User { Phone=phone, UserType="customer", Status=true,
  IsApproved=true, CountryCode="+880", CreatedAt=DateTime.UtcNow }
  Save to DB
- Generate tokens: ITokenService.GenerateAccessToken(user.Id, user.UserType, user.Phone)
- Generate refresh token: ITokenService.GenerateRefreshToken()
- Save refresh token: IRefreshTokenService.SaveRefreshTokenAsync(user.Id, refreshToken)
- Return AuthResult(true, accessToken, refreshToken, user.UserType, "Login successful")

FILE 5: Commands/AdminLoginCommand.cs
```csharp
public record AdminLoginCommand(string Email, string Password) : IRequest<AuthResult>;
```

FILE 6: Commands/AdminLoginCommandHandler.cs
Handler:
- Find user by email where UserType is "admin" or "staff"
- Verify password with BCrypt.Net.BCrypt.Verify(password, user.Password)
- If not found or wrong password: return AuthResult(false,...,"Invalid credentials")
- Generate tokens same as above
- Return AuthResult(true, accessToken, refreshToken, user.UserType, "Login successful")

FILE 7: Commands/RefreshTokenCommand.cs
```csharp
public record RefreshTokenCommand(long UserId, string RefreshToken) : IRequest<AuthResult>;
```

FILE 8: Commands/RefreshTokenCommandHandler.cs
Handler:
- Call IRefreshTokenService.ValidateAndRevokeAsync(userId, refreshToken)
- If false: return AuthResult(false,...,"Invalid refresh token")
- Find user by Id
- Generate new access token + new refresh token
- Save new refresh token
- Return AuthResult(true, newAccessToken, newRefreshToken, user.UserType, "Token refreshed")

Install: BCrypt.Net-Next in OneWeb.Infrastructure
```

---

## TASK 2.4 — Auth Controller

```
ROLE: You are a senior ASP.NET Core developer.

PROJECT: OneWeb — ASP.NET Core 8, MediatR

TASK: Create Auth API controller.

FILE: OneWeb.Api/Controllers/AuthController.cs

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase

ENDPOINTS:

1. POST /api/v1/auth/send-otp
Request body: { "phone": "01XXXXXXXXX" }
→ Send SendOtpCommand via MediatR
→ Return 200 { success, message }
→ Validate: phone required

2. POST /api/v1/auth/verify-otp
Request body: { "phone": "01XXXXXXXXX", "otp": "123456" }
→ Send VerifyOtpCommand via MediatR
→ Return 200 { accessToken, refreshToken, userType }
→ On fail: Return 401

3. POST /api/v1/auth/admin/login
Request body: { "email": "admin@oneweb.com", "password": "..." }
→ Send AdminLoginCommand
→ Return 200 with tokens or 401

4. POST /api/v1/auth/refresh-token
Request body: { "userId": 1, "refreshToken": "..." }
[Authorize] attribute
→ Send RefreshTokenCommand
→ Return 200 with new tokens or 401

5. POST /api/v1/auth/logout
[Authorize]
→ Get userId from JWT claim "sub"
→ Call IRefreshTokenService.RevokeAllUserTokensAsync(userId)
→ Return 200 { message: "Logged out" }

CREATE Request/Response DTOs as nested records inside the controller file.

ALSO CREATE: OneWeb.Api/Middleware/ExceptionHandlingMiddleware.cs
- Catch unhandled exceptions
- Return 500 with { message: "Internal server error", traceId }
- Log with ILogger
Register in Program.cs before app.UseRouting()
```

---

# ════════════════════════════════════════
# PHASE 3 — SERVICE CATALOG
# ════════════════════════════════════════

---

## TASK 3.1 — Service Catalog Queries & Handlers

```
ROLE: You are a senior C# CQRS developer.

PROJECT: OneWeb — ASP.NET Core 8, MediatR, EF Core 8, Redis cache

TASK: Create Service Catalog read operations.

FOLDER: OneWeb.Application/Features/Services/

FILE 1: DTOs/ServiceDto.cs
```csharp
public record ServiceDto(
    long Id, string Name, string? Slug,
    int ParentId, int Level,
    string? ServiceIcon, string? BannerImage,
    double InitialPrice, bool IsTrending,
    List<ServiceDto>? Children = null
);

public record ServiceDetailDto(
    long Id, string Name, string? Slug,
    string? About, string? ServiceQuality,
    string? MetaTitle, string? MetaKeywords, string? MetaDescription,
    List<ServicePriceDto> Prices,
    List<ServiceScheduleDto> Schedules
);

public record ServicePriceDto(long Id, string? Name, double Price);
public record ServiceScheduleDto(long Id, string? Day, string? StartTime, string? EndTime);
```

FILE 2: Queries/GetCategoriesQuery.cs + Handler
Query: GetCategoriesQuery() : IRequest<List<ServiceDto>>
Handler:
- Get from Redis cache key "services:categories" (TTL 10 min)
- If miss: query DB → services where Level=0 AND Status=true
- Include sub-services (Level=1) as Children
- Map to ServiceDto list
- Save to Redis cache
- Return list

FILE 3: Queries/GetServicesQuery.cs + Handler
Query: GetServicesQuery(int Page=1, int PageSize=15, string? Search=null, int? CategoryId=null)
Returns: PagedResult<ServiceDto>
Handler:
- Query services where Level=2 AND Status=true
- If Search: filter by Name.Contains(search)
- If CategoryId: need to find root category and filter
- OrderBy IsTrending descending, then Name
- Skip/Take for pagination
- Map to ServiceDto
- Return PagedResult { Items, TotalCount, Page, PageSize }

FILE 4: Queries/GetServiceBySlugQuery.cs + Handler
Query: GetServiceBySlugQuery(string Slug) : IRequest<ServiceDetailDto?>
Handler:
- Check Redis cache key "service:{slug}"
- If miss: query DB include Prices and Schedules
- Map to ServiceDetailDto
- Cache with TTL 10 min
- Return null if not found

CREATE: OneWeb.Application/Common/Models/PagedResult.cs
```csharp
public record PagedResult<T>(
    List<T> Items, int TotalCount, int Page, int PageSize,
    int TotalPages
);
```
```

---

## TASK 3.2 — Service Catalog Controller

```
ROLE: You are a senior ASP.NET Core developer.

PROJECT: OneWeb — ASP.NET Core 8, MediatR

TASK: Create Service Catalog API controller.

FILE: OneWeb.Api/Controllers/ServicesController.cs

[ApiController]
[Route("api/v1/services")]
public class ServicesController : ControllerBase

ENDPOINTS:

1. GET /api/v1/services/categories
→ Send GetCategoriesQuery
→ Return 200 with list of categories (level=0) with children (level=1)

2. GET /api/v1/services
Query params: page (default 1), pageSize (default 15),
              search (optional), categoryId (optional)
→ Send GetServicesQuery(page, pageSize, search, categoryId)
→ Return 200 with PagedResult<ServiceDto>

3. GET /api/v1/services/{slug}
→ Send GetServiceBySlugQuery(slug)
→ If null: return 404
→ Return 200 with ServiceDetailDto

No authentication required on any endpoint.
Add response caching header: Cache-Control: public, max-age=600
```

---

## TASK 3.3 — Admin Service CRUD Commands

```
ROLE: You are a senior C# CQRS developer.

PROJECT: OneWeb — ASP.NET Core 8, MediatR, EF Core 8
Only Admin and Staff roles can perform these operations.

TASK: Create Service management commands for admin.

FOLDER: OneWeb.Application/Features/Services/Commands/

FILE 1: CreateServiceCommand.cs + Handler
Command:
```csharp
public record CreateServiceCommand(
    string Name, int ParentId, int Level,
    double CommissionRate, string? ServiceIcon, string? BannerImage,
    double InitialPrice, string? About, string? ServiceQuality,
    string? MetaTitle, string? MetaKeywords, string? MetaDescription,
    bool IsTrending, int CreatedBy
) : IRequest<long>;
```
Handler:
- Generate slug: name.ToLower().Replace(" ", "-") + "-" + Guid.NewGuid().ToString()[..5]
- Create Service entity, save to DB
- Invalidate Redis cache keys: "services:categories", "services:*"
- Return new service Id

FILE 2: UpdateServiceCommand.cs + Handler
Command: UpdateServiceCommand(long Id, same fields as Create except CreatedBy)
Handler:
- Find service by Id, throw NotFoundException if not found
- Update fields
- Regenerate slug if Name changed
- Save changes
- Invalidate Redis cache
- Return Id

FILE 3: DeleteServiceCommand.cs + Handler
Command: DeleteServiceCommand(long Id) : IRequest<bool>
Handler:
- Find service, throw NotFoundException if not found
- Check if any active orders exist for this service
- If yes: throw ValidationException("Cannot delete service with active orders")
- Remove from DB
- Invalidate cache
- Return true

FILE 4: CreateServicePriceCommand.cs + Handler
Command: CreateServicePriceCommand(long ServiceId, string? Name, double Price)
Handler: Add ServicePrice, save, return Id

FILE 5: DeleteServicePriceCommand.cs + Handler
Command: DeleteServicePriceCommand(long Id)
Handler: Find and remove ServicePrice

CREATE: OneWeb.Application/Common/Exceptions/NotFoundException.cs
CREATE: OneWeb.Application/Common/Exceptions/ValidationException.cs

UPDATE: ExceptionHandlingMiddleware to handle these:
- NotFoundException → 404
- ValidationException → 400 with message
```

---

# ════════════════════════════════════════
# PHASE 4 — ORDER / BOOKING
# ════════════════════════════════════════

---

## TASK 4.1 — Order Commands & Handlers

```
ROLE: You are a senior C# CQRS developer.

PROJECT: OneWeb — ASP.NET Core 8, MediatR, EF Core 8

TASK: Create Order booking commands.

FOLDER: OneWeb.Application/Features/Orders/

FILE 1: DTOs/OrderDto.cs
```csharp
public record OrderDto(
    long Id, string? TrackingCode, string DeliveryStatus,
    string PaymentStatus, string? PaymentType,
    double? GrandTotal, double CouponDiscount,
    string? ShippingAddress, string? AdditionalInfo,
    DateTime? CreatedAt, ServiceSummaryDto? Service,
    string? OrderFrom
);

public record ServiceSummaryDto(long Id, string Name, string? Slug);

public record OrderDetailResponse(
    OrderDto Order,
    List<StatusHistoryItem> StatusHistory
);

public record StatusHistoryItem(string Status, DateTime Timestamp);
```

FILE 2: Commands/CreateOrderCommand.cs + Handler
Command:
```csharp
public record CreateOrderCommand(
    long UserId, int ServiceId, string ShippingAddress,
    string? AdditionalInfo, string? PaymentType,
    double GrandTotal, string? CouponCode,
    string? Latitude, string? Longitude,
    string OrderFrom = "web"
) : IRequest<CreateOrderResult>;

public record CreateOrderResult(bool Success, long? OrderId,
    string? TrackingCode, string? Message);
```
Handler:
- Validate: ServiceId exists and Level=2 and Status=true
- If CouponCode provided: validate coupon (not expired, usage limit not reached)
- Calculate discount if coupon valid
- Generate TrackingCode: "OW-" + DateTime.UtcNow.ToString("yyyyMMdd") + "-" + Random.Shared.Next(1000,9999)
- Create Order entity with DeliveryStatus="pending", PaymentStatus="unpaid"
- Create OrderDetail entity
- If coupon used: increment CouponUsage count
- Save to DB
- Return CreateOrderResult

FILE 3: Commands/UpdateOrderStatusCommand.cs + Handler
Command:
```csharp
public record UpdateOrderStatusCommand(
    long OrderId, string NewStatus, long UpdatedByUserId, string UpdatedByRole
) : IRequest<bool>;
```
Valid transitions:
- pending → confirmed (Admin/Staff only)
- confirmed → assigned (Admin/Staff only)
- assigned → on_the_way (Vendor only)
- on_the_way → in_progress (Vendor only)
- in_progress → completed (Vendor only)
- any → cancelled (Admin or Customer if still pending)

Handler:
- Fetch order
- Validate transition based on role
- Update DeliveryStatus
- Append to DeliverStatusJson:
  [{status: "pending", timestamp: "..."}, {status: "confirmed", timestamp: "..."}]
- If completed: calculate commission and update vendor balance
  vendorAmount = GrandTotal * (vendorCommissionRate / 100)
  adminAmount = GrandTotal - vendorAmount
  Create CommissionHistory record
  Update vendor: PendingBalance += vendorAmount
- Save changes
- Return true

FILE 4: Commands/CancelOrderCommand.cs + Handler
Command: CancelOrderCommand(long OrderId, long UserId, string UserRole)
Handler:
- Fetch order
- If UserRole = "customer": only allow cancel if DeliveryStatus = "pending"
- If UserRole = "admin" or "staff": allow cancel any non-completed order
- Set IsCancelled = 1, DeliveryStatus = "cancelled"
- Save changes

FILE 5: Queries/GetOrdersQuery.cs + Handler
Query: GetOrdersQuery(long UserId, string UserRole, int Page=1, int PageSize=15)
Handler:
- If role = "customer": filter by UserId
- If role = "vendor": filter by VendorId
- If role = "admin" or "staff": return all
- OrderBy CreatedAt descending
- Include Service navigation
- Map to OrderDto
- Return PagedResult<OrderDto>

FILE 6: Queries/GetOrderByIdQuery.cs + Handler
Query: GetOrderByIdQuery(long OrderId, long UserId, string UserRole)
Handler:
- Fetch order with Service
- If customer role: verify order.UserId == UserId
- If vendor role: verify order.VendorId == UserId
- Parse DeliverStatusJson to List<StatusHistoryItem>
- Return OrderDetailResponse
```

---

## TASK 4.2 — Order Controller

```
ROLE: You are a senior ASP.NET Core developer.

PROJECT: OneWeb — ASP.NET Core 8, MediatR, JWT Auth

TASK: Create Order API controller.

FILE: OneWeb.Api/Controllers/OrdersController.cs

[ApiController]
[Route("api/v1/orders")]
[Authorize]
public class OrdersController : ControllerBase

Helper method in controller:
```csharp
private long GetUserId() =>
    long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
private string GetUserRole() =>
    User.FindFirstValue(ClaimTypes.Role)!;
```

ENDPOINTS:

1. GET /api/v1/orders
[Authorize]
→ Send GetOrdersQuery(GetUserId(), GetUserRole(), page, pageSize)
→ Return PagedResult<OrderDto>

2. POST /api/v1/orders
[Authorize(Roles = "customer")]
Body: { serviceId, shippingAddress, additionalInfo, paymentType,
        grandTotal, couponCode, latitude, longitude }
→ Send CreateOrderCommand with UserId = GetUserId()
→ Return 201 with { orderId, trackingCode }

3. GET /api/v1/orders/{id}
[Authorize]
→ Send GetOrderByIdQuery(id, GetUserId(), GetUserRole())
→ Return 200 or 404

4. POST /api/v1/orders/{id}/cancel
[Authorize]
→ Send CancelOrderCommand(id, GetUserId(), GetUserRole())
→ Return 200 { message: "Order cancelled" }

5. POST /api/v1/orders/{id}/status (Vendor + Admin)
[Authorize(Roles = "vendor,admin,staff")]
Body: { newStatus }
→ Send UpdateOrderStatusCommand(id, newStatus, GetUserId(), GetUserRole())
→ Return 200 or 400

6. POST /api/v1/admin/orders/{id}/assign-vendor
[Authorize(Roles = "admin,staff")]
Body: { vendorId }
→ Find order, set VendorId = vendorId, DeliveryStatus = "assigned"
→ Save changes
→ Return 200 { message: "Vendor assigned" }
```

---

# ════════════════════════════════════════
# PHASE 5 — VENDOR PORTAL
# ════════════════════════════════════════

---

## TASK 5.1 — Vendor Queries & Commands

```
ROLE: You are a senior C# CQRS developer.

PROJECT: OneWeb — ASP.NET Core 8, MediatR, EF Core 8

TASK: Create Vendor management features.

FOLDER: OneWeb.Application/Features/Vendors/

FILE 1: DTOs/VendorDto.cs
```csharp
public record VendorDto(
    long Id, long UserId, string? UserName, string? Phone,
    double Balance, double PendingBalance, double TotalEarnings,
    string? Address, bool Status, DateTime? CreatedAt
);

public record VendorEarningsDto(
    double Balance, double PendingBalance, double TotalEarnings,
    List<CommissionHistoryDto> RecentCommissions
);

public record CommissionHistoryDto(
    long OrderId, double VendorAmount, double CommissionAmount, DateTime? CreatedAt
);
```

FILE 2: Commands/RegisterVendorCommand.cs + Handler
Command:
```csharp
public record RegisterVendorCommand(
    long UserId, string? ServiceIds,
    string? BankName, string? BankAccountName,
    string? BankAccountNumber, string? BankRoutingNumber,
    int? Division, int? District,
    string? Address, string? ShortBiography,
    string? Nid, string? TradeLicense
) : IRequest<long>;
```
Handler:
- Check if vendor already exists for userId
- Create Vendor entity
- Update User.UserType = "vendor"
- Save to DB
- Return vendorId

FILE 3: Queries/GetVendorEarningsQuery.cs + Handler
Query: GetVendorEarningsQuery(long VendorId)
Handler:
- Find vendor by UserId = VendorId
- Get last 20 CommissionHistory records
- Return VendorEarningsDto

FILE 4: Commands/CreateWithdrawRequestCommand.cs + Handler
Command: CreateWithdrawRequestCommand(long VendorId, double Amount,
         string PaymentMethod, string AccountNumber)
Handler:
- Find vendor
- Validate: vendor.Balance >= Amount
- Validate: Amount >= 500 (minimum withdrawal)
- Create VendorWithdrawRequest with Status = "pending"
- Deduct from vendor.Balance
- Save changes
- Return request Id

FILE 5: Queries/GetVendorsQuery.cs + Handler (Admin)
Query: GetVendorsQuery(int Page=1, int PageSize=15, bool? Status=null)
Handler:
- Query vendors, include User
- Filter by Status if provided
- Return PagedResult<VendorDto>
```

---

## TASK 5.2 — Vendor Controller

```
ROLE: You are a senior ASP.NET Core developer.

PROJECT: OneWeb — ASP.NET Core 8

TASK: Create Vendor API controllers.

FILE 1: OneWeb.Api/Controllers/VendorController.cs
[ApiController]
[Route("api/v1/vendor")]
[Authorize(Roles = "vendor")]

ENDPOINTS:
1. GET /api/v1/vendor/earnings
   → GetVendorEarningsQuery(GetUserId())
   → Return VendorEarningsDto

2. POST /api/v1/vendor/withdraw-requests
   Body: { amount, paymentMethod, accountNumber }
   → CreateWithdrawRequestCommand
   → Return 201 { requestId }

3. POST /api/v1/vendor/register
   [Authorize(Roles = "customer")] — customer becomes vendor
   Body: all vendor registration fields
   → RegisterVendorCommand
   → Return 201 { vendorId }

FILE 2: OneWeb.Api/Controllers/Admin/VendorsAdminController.cs
[ApiController]
[Route("api/v1/admin/vendors")]
[Authorize(Roles = "admin,staff")]

ENDPOINTS:
1. GET /api/v1/admin/vendors
   Query: page, pageSize, status
   → GetVendorsQuery
   → Return PagedResult<VendorDto>

2. GET /api/v1/admin/vendors/{id}
   → Get single vendor with user details

3. PUT /api/v1/admin/vendors/{id}/status
   Body: { status: true/false }
   → Update vendor status
   → Return 200

4. GET /api/v1/admin/vendors/{id}/withdraw-requests
   → Get all withdraw requests for vendor

5. PUT /api/v1/admin/withdraw-requests/{id}/approve
   Body: { status: "approved" | "rejected", note }
   → Update withdraw request status
   → If approved: no balance change (already deducted)
   → If rejected: refund balance to vendor
   → Return 200
```

---

# ════════════════════════════════════════
# PHASE 6 — ADMIN DASHBOARD
# ════════════════════════════════════════

---

## TASK 6.1 — Dashboard Stats & Admin Controllers

```
ROLE: You are a senior C# developer.

PROJECT: OneWeb — ASP.NET Core 8, MediatR, EF Core 8

TASK: Create Admin dashboard stats and user management.

FILE 1: OneWeb.Application/Features/Dashboard/Queries/GetDashboardStatsQuery.cs
Query: GetDashboardStatsQuery() : IRequest<DashboardStatsDto>

DashboardStatsDto:
```csharp
public record DashboardStatsDto(
    int TotalOrders, int PendingOrders, int CompletedOrders,
    int CancelledOrders, int TotalUsers, int TotalVendors,
    double TotalRevenue, double TodayRevenue,
    int TotalServices, List<RecentOrderDto> RecentOrders
);
public record RecentOrderDto(long Id, string? TrackingCode,
    string DeliveryStatus, double? GrandTotal, DateTime? CreatedAt);
```

Handler:
- TotalOrders: count all orders
- PendingOrders: count where DeliveryStatus = "pending"
- CompletedOrders: count where DeliveryStatus = "completed"
- CancelledOrders: count where IsCancelled = 1
- TotalUsers: count users where UserType = "customer"
- TotalVendors: count vendors
- TotalRevenue: sum of GrandTotal where PaymentStatus = "paid"
- TodayRevenue: same but CreatedAt.Date = today
- TotalServices: count services where Level = 2 AND Status = true
- RecentOrders: last 10 orders with tracking code and status
Cache result in Redis with TTL 5 minutes

FILE 2: OneWeb.Api/Controllers/Admin/DashboardController.cs
[ApiController]
[Route("api/v1/admin/dashboard")]
[Authorize(Roles = "admin,staff")]

GET /api/v1/admin/dashboard/stats
→ GetDashboardStatsQuery
→ Return DashboardStatsDto

FILE 3: OneWeb.Api/Controllers/Admin/UsersAdminController.cs
[ApiController]
[Route("api/v1/admin/users")]
[Authorize(Roles = "admin,staff")]

ENDPOINTS:
1. GET /api/v1/admin/users
   Query: page, pageSize, userType, search
   → Query users with filters
   → Return PagedResult

2. GET /api/v1/admin/users/{id}
   → Return user detail

3. PUT /api/v1/admin/users/{id}/status
   Body: { isBanned: true/false }
   → Update user ban status

4. DELETE /api/v1/admin/users/{id}
   → Soft delete (set DeletedAt = DateTime.UtcNow)
```

---

# ════════════════════════════════════════
# PHASE 7 — PAYMENT
# ════════════════════════════════════════

---

## TASK 7.1 — Payment Service

```
ROLE: You are a senior C# developer.

PROJECT: OneWeb — ASP.NET Core 8

TASK: Create payment processing service.

FILE 1: OneWeb.Domain/Interfaces/IPaymentService.cs
```csharp
public interface IPaymentService
{
    Task<PaymentResult> ProcessCodPaymentAsync(long orderId, long userId);
    Task<PaymentResult> InitiateMobilePaymentAsync(
        long orderId, long userId, string provider, double amount);
    Task<bool> VerifyMobilePaymentAsync(
        long orderId, string transactionId, string provider);
}
public record PaymentResult(bool Success, string? TransactionId,
    string? PaymentUrl, string? Message);
```

FILE 2: OneWeb.Infrastructure/Services/PaymentService.cs
Implement IPaymentService:

ProcessCodPaymentAsync:
- Find order, verify it belongs to userId
- Create Payment record: Method="cod", Status="pending"
- Update Order.PaymentStatus = "unpaid" (COD is confirmed after delivery)
- Save changes
- Return PaymentResult(true, "COD-{orderId}", null, "COD confirmed")

InitiateMobilePaymentAsync:
- Supported providers: "bkash", "nagad", "rocket"
- For now: Create Payment record with Status="pending"
- Return PaymentResult(true, Guid.NewGuid().ToString(), 
  "https://payment.oneweb.com/pay/{orderId}", "Redirect to payment")
- NOTE: Add comment "TODO: Integrate actual bKash/Nagad API"

VerifyMobilePaymentAsync:
- Find Payment by OrderId
- Update Payment.TransactionId = transactionId, Status = "completed"
- Update Order.PaymentStatus = "paid"
- Save changes
- Return true

FILE 3: OneWeb.Api/Controllers/PaymentsController.cs
[ApiController]
[Route("api/v1/payments")]
[Authorize]

ENDPOINTS:
1. POST /api/v1/payments/cod
   Body: { orderId }
   → ProcessCodPaymentAsync(orderId, GetUserId())
   → Return 200

2. POST /api/v1/payments/initiate
   Body: { orderId, provider, amount }
   → InitiateMobilePaymentAsync(...)
   → Return { paymentUrl, transactionId }

3. POST /api/v1/payments/verify
   Body: { orderId, transactionId, provider }
   → VerifyMobilePaymentAsync(...)
   → Return 200 or 400
```

---

# ════════════════════════════════════════
# PHASE 8 — NOTIFICATIONS
# ════════════════════════════════════════

---

## TASK 8.1 — FCM & SignalR Notifications

```
ROLE: You are a senior C# developer.

PROJECT: OneWeb — ASP.NET Core 8, Firebase Admin SDK, SignalR

TASK: Create push notification service and real-time hub.

FILE 1: OneWeb.Infrastructure/Services/FcmService.cs
```csharp
public interface IFcmService
{
    Task SendToUserAsync(long userId, string title, string body, Dictionary<string, string>? data = null);
    Task SendToTopicAsync(string topic, string title, string body);
}
```
Implement using FirebaseAdmin:
- Initialize Firebase in DependencyInjection.cs:
  FirebaseApp.Create(new AppOptions {
    Credential = GoogleCredential.FromFile(config["Firebase:CredentialsPath"])
  })
- SendToUserAsync:
  → Get user's FCM tokens from fcm_tokens table
  → Send MulticastMessage to all tokens
  → Remove invalid tokens (registration-token-not-registered error)
- SendToTopicAsync:
  → Send to Firebase topic

FILE 2: OneWeb.Api/Hubs/OrderHub.cs
```csharp
[Authorize]
public class OrderHub : Hub
{
    public async Task JoinOrderGroup(string orderId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, $"order_{orderId}");

    public async Task LeaveOrderGroup(string orderId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"order_{orderId}");
}
```

FILE 3: OneWeb.Infrastructure/Services/NotificationService.cs
```csharp
public interface INotificationService
{
    Task NotifyOrderStatusChanged(long orderId, string newStatus, long userId);
    Task SaveNotification(long? userId, string title, string body, string type);
}
```
Implement:
- NotifyOrderStatusChanged:
  → Save to notifications table
  → Send FCM push via IFcmService
  → Broadcast via SignalR: _hubContext.Clients.Group($"order_{orderId}")
    .SendAsync("OrderStatusUpdated", new { orderId, status: newStatus })
- SaveNotification: Insert into notifications table

Register in DependencyInjection.cs
Add to UpdateOrderStatusCommandHandler after saving status change.

FILE 4: Program.cs additions:
- builder.Services.AddSignalR()
- app.MapHub<OrderHub>("/hubs/orders")

FILE 5: OneWeb.Api/Controllers/NotificationsController.cs
[Authorize]
GET /api/v1/notifications
→ Get notifications for current user ordered by CreatedAt desc
→ Pagination: page, pageSize=15

POST /api/v1/notifications/{id}/read
→ Mark notification as IsRead = true

POST /api/v1/notifications/fcm-token
Body: { token, deviceType }
→ Save/update FCM token for current user
```

---

# ════════════════════════════════════════
# PHASE 9 — CMS & SETTINGS
# ════════════════════════════════════════

---

## TASK 9.1 — CMS Controllers (Sliders, Blogs, Pages)

```
ROLE: You are a senior ASP.NET Core developer.

PROJECT: OneWeb — ASP.NET Core 8, EF Core 8

TASK: Create CMS API endpoints.

FILE 1: OneWeb.Api/Controllers/SlidersController.cs
Public endpoint (no auth):
GET /api/v1/sliders → return active sliders ordered by Id

Admin endpoints (admin/staff auth):
POST /api/v1/admin/sliders → create slider
PUT /api/v1/admin/sliders/{id} → update
DELETE /api/v1/admin/sliders/{id} → delete

FILE 2: OneWeb.Api/Controllers/BlogsController.cs
Public:
GET /api/v1/blogs → paginated, filter by categoryId, status=true
GET /api/v1/blogs/{slug} → blog detail with translations

Admin:
POST /api/v1/admin/blogs → create (body: title, slug, categoryId, content, image, metaKeywords, metaDescription)
PUT /api/v1/admin/blogs/{id} → update
DELETE /api/v1/admin/blogs/{id} → soft delete (status=false)
POST /api/v1/admin/blogs/{id}/translations → add/update translation
Body: { lang, title, content }

FILE 3: OneWeb.Api/Controllers/SettingsController.cs
Public:
GET /api/v1/settings → return all business_settings as key-value dictionary

Admin:
PUT /api/v1/admin/settings → update settings
Body: [{ type, value, lang }]
→ Upsert each setting
→ Invalidate Redis cache "business_settings"

FILE 4: OneWeb.Api/Controllers/LocationsController.cs
Public (cached 24hr in Redis):
GET /api/v1/locations/divisions → all divisions
GET /api/v1/locations/districts?divisionId=X → districts by division
GET /api/v1/locations/upazilas?districtId=X → upazilas by district
```

---

# ════════════════════════════════════════
# PHASE 10 — gRPC SERVICES
# ════════════════════════════════════════

---

## TASK 10.1 — Proto Files & gRPC Implementation

```
ROLE: You are a senior gRPC / C# developer.

PROJECT: OneWeb — ASP.NET Core 8, Grpc.AspNetCore

TASK: Create proto files and gRPC service implementations.

FILE 1: /proto/order_service.proto
```proto
syntax = "proto3";
option csharp_namespace = "OneWeb.GrpcServices";

service OrderService {
  rpc CreateOrder (CreateOrderRequest) returns (OrderResponse);
  rpc UpdateOrderStatus (UpdateStatusRequest) returns (OrderResponse);
  rpc GetOrderById (GetOrderRequest) returns (OrderResponse);
}

message CreateOrderRequest {
  int64 user_id = 1;
  int32 service_id = 2;
  string shipping_address = 3;
  double grand_total = 4;
  string payment_type = 5;
}

message UpdateStatusRequest {
  int64 order_id = 1;
  string new_status = 2;
  int64 updated_by = 3;
  string role = 4;
}

message GetOrderRequest {
  int64 order_id = 1;
}

message OrderResponse {
  bool success = 1;
  int64 order_id = 2;
  string tracking_code = 3;
  string status = 4;
  string message = 5;
}
```

FILE 2: /proto/notification_service.proto
```proto
syntax = "proto3";
option csharp_namespace = "OneWeb.GrpcServices";

service NotificationService {
  rpc SendPush (PushRequest) returns (PushResponse);
  rpc SendSms (SmsRequest) returns (SmsResponse);
}

message PushRequest {
  int64 user_id = 1;
  string title = 2;
  string body = 3;
}

message PushResponse { bool success = 1; string message = 2; }

message SmsRequest { string phone = 1; string message = 2; }
message SmsResponse { bool success = 1; }
```

FILE 3: OneWeb.GrpcServices/Services/OrderGrpcService.cs
Implement OrderService.OrderServiceBase:
- CreateOrder: call MediatR CreateOrderCommand via IMediator
- UpdateOrderStatus: call UpdateOrderStatusCommand
- GetOrderById: query DB, return OrderResponse

FILE 4: OneWeb.GrpcServices/Services/NotificationGrpcService.cs
Implement NotificationService.NotificationServiceBase:
- SendPush: call IFcmService.SendToUserAsync
- SendSms: call ISmsService.SendOtpAsync (reuse for any SMS)

FILE 5: OneWeb.GrpcServices/Program.cs
```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddGrpc();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

var app = builder.Build();
app.MapGrpcService<OrderGrpcService>();
app.MapGrpcService<NotificationGrpcService>();
app.Run();
```

Set port 5001 in launchSettings.json for GrpcServices project.
```

---

# ════════════════════════════════════════
# PHASE 11 — NEXT.JS FRONTEND
# ════════════════════════════════════════

---

## TASK 11.1 — Next.js Project Setup & API Client

```
ROLE: You are a senior Next.js 14 developer.

PROJECT: OneWeb — Next.js 14 App Router, TypeScript, Tailwind CSS

TASK: Setup Next.js project with API client and auth.

COMMANDS to run:
```bash
cd D:\OneWeb\frontend
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
npm install axios js-cookie @types/js-cookie zustand react-hot-toast
```

FILE 1: src/lib/api.ts
Create axios instance:
- baseURL: process.env.NEXT_PUBLIC_API_URL (default: http://localhost:5102/api/v1)
- Request interceptor: attach Authorization: Bearer {token} from cookie/localStorage
- Response interceptor:
  - If 401: try refresh token → retry request
  - If refresh fails: redirect to /login

FILE 2: src/lib/auth.ts
```typescript
export const getAccessToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

export const setTokens = (accessToken: string, refreshToken: string, userId: number) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  localStorage.setItem('user_id', userId.toString());
};

export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_id');
};

export const getUserId = (): number | null => {
  const id = localStorage.getItem('user_id');
  return id ? parseInt(id) : null;
};
```

FILE 3: src/store/authStore.ts (Zustand)
```typescript
interface AuthState {
  isAuthenticated: boolean;
  userType: string | null;
  userId: number | null;
  login: (accessToken: string, refreshToken: string,
          userType: string, userId: number) => void;
  logout: () => void;
}
```
Implement with zustand and persist middleware.

FILE 4: src/app/layout.tsx
- Import Inter font from next/font/google
- Tailwind base styles
- Add <Toaster /> from react-hot-toast
- Wrap with AuthProvider (check token on mount)

FILE 5: src/middleware.ts
Protect routes:
- /dashboard/* → redirect to /login if no token
- /vendor/* → redirect to /login if no token
- /admin/* → redirect to /admin/login if no token
```

---

## TASK 11.2 — Public Pages (Home, Services)

```
ROLE: You are a senior Next.js 14 / Tailwind CSS developer.

PROJECT: OneWeb — Next.js 14 App Router, TypeScript, Tailwind CSS
API base: http://localhost:5102/api/v1
Color scheme: Primary #FF6B35 (orange), Background #FFFFFF, Text #1A1A1A

TASK: Create public-facing pages.

FILE 1: src/app/(public)/page.tsx (Home page)
Sections:
1. Hero/Banner: Slider from GET /sliders
   - Full width image carousel (auto-slide 5s)
   - Title overlay text

2. Service Categories: GET /services/categories
   - Grid of category cards (icon + name)
   - Click → navigate to /services?categoryId={id}

3. Trending Services: GET /services?page=1&pageSize=8
   - 4-column grid of service cards
   - Card: banner image, name, initialPrice, "Book Now" button

4. How It Works section (static):
   - 3 steps: Browse → Book → Done

5. Footer: logo, links, contact

FILE 2: src/app/(public)/services/page.tsx
- Fetch categories for filter sidebar
- Fetch services with pagination
- Left sidebar: category filter
- Search bar at top
- Service card grid (3 columns)
- Pagination buttons

FILE 3: src/app/(public)/services/[slug]/page.tsx
- Fetch GET /services/{slug}
- Display: banner image, name, about (dangerouslySetInnerHTML)
- Pricing table from service prices
- Available schedules
- "Book This Service" button → redirect to /login if not auth

FILE 4: src/components/ServiceCard.tsx
Reusable card component:
- Props: { id, name, slug, bannerImage, initialPrice, isTrending }
- Trending badge
- Image with next/image
- Book Now button

FILE 5: src/components/Navbar.tsx
- Logo: "OneWeb"
- Nav links: Home, Services, Blogs
- If authenticated: My Orders, Logout
- If not: Login button
- Mobile responsive hamburger menu
```

---

## TASK 11.3 — Auth Pages

```
ROLE: You are a senior Next.js 14 developer.

PROJECT: OneWeb — Next.js 14 App Router, TypeScript, Tailwind CSS
Primary color: #FF6B35

TASK: Create authentication pages.

FILE 1: src/app/(auth)/login/page.tsx
Two-step OTP login:

STEP 1 — Phone input:
- Input: phone number (01XXXXXXXXX format)
- Validate: must be 11 digits starting with 01
- On submit: POST /auth/send-otp
- Show loading state
- On success: move to Step 2

STEP 2 — OTP input:
- 6 individual input boxes (auto-focus next on input)
- 60-second countdown timer for resend
- On submit: POST /auth/verify-otp
- On success: save tokens via setTokens()
- Redirect based on userType:
  - customer → /dashboard
  - vendor → /vendor
  - admin/staff → /admin

FILE 2: src/app/(auth)/admin/login/page.tsx
Simple email + password form:
- POST /auth/admin/login
- On success: save tokens, redirect to /admin

FILE 3: src/components/OtpInput.tsx
Reusable 6-digit OTP input component:
- Auto-focus next input on digit entry
- Backspace moves to previous
- Paste support (paste 6 digits at once)
- Props: { onComplete: (otp: string) => void }
```

---

## TASK 11.4 — Customer Dashboard & Order Tracking

```
ROLE: You are a senior Next.js 14 developer.

PROJECT: OneWeb — Next.js 14, TypeScript, Tailwind CSS
All pages require authentication (handled by middleware).

TASK: Create customer dashboard pages.

FILE 1: src/app/dashboard/page.tsx
- Stats cards: Total Orders, Pending, Completed
- Recent orders table (last 5)
- Quick links: Book Service, My Profile

FILE 2: src/app/dashboard/orders/page.tsx
- Fetch GET /orders (paginated)
- Table columns: Tracking Code, Service, Status badge, Amount, Date, Action
- Status badge colors:
  pending=yellow, confirmed=blue, assigned=indigo,
  on_the_way=purple, in_progress=orange, completed=green, cancelled=red
- Pagination
- Search by tracking code (client-side filter)

FILE 3: src/app/dashboard/orders/[id]/page.tsx
Order detail page:
- Order info: tracking code, service name, address, amount
- Status timeline (vertical stepper):
  Show all stages, highlight current, grey out future
  Each stage shows timestamp if available
- Payment info: method, status
- Cancel button (only if status = "pending")
- SignalR connection for real-time status updates:
  ```typescript
  const connection = new HubConnectionBuilder()
    .withUrl('/hubs/orders', { accessTokenFactory: () => getAccessToken()! })
    .build();
  connection.on('OrderStatusUpdated', (data) => {
    // refresh order status
  });
  await connection.invoke('JoinOrderGroup', orderId.toString());
  ```
  Install: npm install @microsoft/signalr

FILE 4: src/app/dashboard/profile/page.tsx
- Display current user info (GET /profile)
- Edit form: name, email, address
- Saved addresses list (GET /addresses)
- Add new address form
```

---

## TASK 11.5 — Admin Panel Pages

```
ROLE: You are a senior Next.js 14 developer.

PROJECT: OneWeb — Next.js 14, TypeScript, Tailwind CSS
Admin panel: route group /admin, sidebar layout

TASK: Create Admin panel pages.

FILE 1: src/app/admin/layout.tsx
Admin layout with:
- Fixed left sidebar (240px)
- Sidebar links:
  Dashboard, Services, Orders, Vendors, Users,
  Payments, Coupons, Sliders, Blogs, Settings
- Top header with admin name + logout
- Main content area (right side)

FILE 2: src/app/admin/page.tsx (Dashboard)
- Fetch GET /admin/dashboard/stats
- Stats cards: Total Orders, Pending Orders, Total Revenue, Today Revenue,
  Total Users, Total Vendors, Total Services
- Recent orders table (last 10)
- Simple bar chart using CSS (no external lib needed):
  show order counts by status

FILE 3: src/app/admin/orders/page.tsx
- Full order management table
- Columns: ID, Tracking, Customer, Service, Status, Payment, Amount, Date, Actions
- Filter by: status, payment status, date range
- "Assign Vendor" button → modal with vendor dropdown
- "Update Status" button → dropdown to change status
- Export CSV button (client-side)

FILE 4: src/app/admin/services/page.tsx
- Tree view of services (Category → Sub → Leaf)
- Add/Edit/Delete at each level
- Toggle status (active/inactive)
- "Add Service" modal with all fields
- Service icon and banner image upload

FILE 5: src/app/admin/vendors/page.tsx
- Vendors table with: Name, Phone, Balance, Status, Joined
- Approve/Ban buttons
- View earnings detail modal
- Withdraw requests section (separate tab)
  - Table: vendor, amount, method, status
  - Approve/Reject buttons
```

---

# ════════════════════════════════════════
# PHASE 12 — FINAL SETUP & SEED DATA
# ════════════════════════════════════════

---

## TASK 12.1 — Database Seed & Final Configuration

```
ROLE: You are a senior .NET developer.

PROJECT: OneWeb — ASP.NET Core 8, EF Core 8, PostgreSQL

TASK: Create database seeder and final application configuration.

FILE 1: OneWeb.Infrastructure/Persistence/DatabaseSeeder.cs
Create static class DatabaseSeeder with SeedAsync(AppDbContext db) method:

Seed if table is empty:

1. Admin user:
```csharp
new User {
  Name = "OneWeb Admin",
  Email = "admin@oneweb.com",
  Password = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
  UserType = "admin",
  Status = true,
  IsApproved = true,
  CreatedAt = DateTime.UtcNow
}
```

2. Business Settings:
```csharp
var settings = new List<BusinessSetting> {
  new() { Type="vendor_commission", Value="70" },
  new() { Type="current_version_android", Value="1.0.0", Lang="en" },
  new() { Type="minimum_version_required_android", Value="1.0.0", Lang="en" },
  new() { Type="current_version_ios", Value="1.0.0", Lang="en" },
  new() { Type="minimum_version_required_ios", Value="1.0.0", Lang="en" },
};
```

3. Sample Divisions (Bangladesh):
Seed: Dhaka(1), Chittagong(2), Rajshahi(3), Khulna(4),
      Barisal(5), Sylhet(6), Rangpur(7), Mymensingh(8)

4. Sample service categories:
```
AC Servicing (level=0), Electric & Plumbing (level=0),
Cleaning Solution (level=0), Trips & Travels (level=0)
```

FILE 2: Update Program.cs — Run seeder on startup:
```csharp
using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
await db.Database.MigrateAsync();
await DatabaseSeeder.SeedAsync(db);
```

FILE 3: OneWeb.Api/.env.example
Create example env file with all required config keys.

FILE 4: /README.md
Complete setup guide:
1. Prerequisites: .NET 8, Node 18+, PostgreSQL 16, Redis
2. Clone → cd OneWeb
3. Update appsettings.json connection strings
4. cd src/OneWeb.Api && dotnet run
5. cd frontend && npm install && npm run dev
6. Swagger: http://localhost:5102/swagger
7. Default admin: admin@oneweb.com / Admin@123

FILE 5: /.gitignore
Standard .NET + Node .gitignore
Exclude: appsettings.json secrets, node_modules,
bin/, obj/, .env, firebase-credentials.json
```

---

# ════════════════════
# DONE! Total Tasks: 24
# Run in order: 1.1 → 1.2 → 1.3 → ... → 12.1
# ════════════════════
