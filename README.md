# OneWeb - Home Service Marketplace

![OneWeb Logo](https://img.shields.io/badge/OneWeb-Orange?style=for-the-badge)

OneWeb is a home service marketplace platform built for Bangladesh, connecting customers with service providers for various home services.

## 🚀 Tech Stack

### Backend
- **Framework**: ASP.NET Core 10
- **Database**: PostgreSQL 16 with EF Core 8
- **Caching**: Redis
- **Authentication**: JWT Bearer + Refresh Token
- **Real-time**: SignalR
- **API**: RESTful + gRPC
- **Notifications**: Firebase Cloud Messaging (FCM)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Real-time**: SignalR Client

## 📋 Prerequisites

- .NET 10 SDK
- Node.js 18+
- PostgreSQL 16
- Redis
- Firebase Account (for push notifications)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/oneweb.git
cd oneweb
```

### 2. Backend Setup

#### Update Connection Strings
Edit `src/OneWeb.Api/appsettings.json` or create `.env` file:
```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Database=oneweb;Username=postgres;Password=yourpassword"
  },
  "Redis": {
    "ConnectionString": "localhost:6379"
  },
  "Jwt": {
    "SecretKey": "YourSuperSecretKeyHereMinimum32Characters!",
    "Issuer": "OneWeb",
    "Audience": "OneWebUsers"
  }
}
```

#### Run Migrations
```bash
cd src/OneWeb.Infrastructure
dotnet ef database update
```

#### Seed Database
The seeder runs automatically on startup and creates:
- Admin user: `admin@oneweb.com` / `Admin@123`
- Business settings
- Bangladesh divisions
- Sample service categories

#### Start API
```bash
cd src/OneWeb.Api
dotnet run
```
API will be available at `http://localhost:5102`
Swagger UI: `http://localhost:5102/swagger`

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your API URL
npm run dev
```
Frontend will be available at `http://localhost:3000`

### 4. Run with Docker
```bash
docker-compose up -d
```

## 📁 Project Structure

```
oneweb/
├── src/
│   ├── OneWeb.Domain/           # Entities & Interfaces
│   ├── OneWeb.Application/     # CQRS, DTOs, Features
│   ├── OneWeb.Infrastructure/ # EF Core, Services, Persistence
│   ├── OneWeb.Api/             # REST API Controllers
│   └── OneWeb.GrpcServices/   # gRPC Services
├── Services/                   # Microservices
│   ├── OneWeb.AuthService/
│   ├── OneWeb.UserService/
│   ├── OneWeb.CatalogService/
│   ├── OneWeb.BookingService/
│   ├── OneWeb.PaymentService/
│   └── OneWeb.ContentService/
├── Apps/
│   ├── OneWeb.Gateway/        # API Gateway
│   └── OneWeb.Web/            # Next.js Frontend (in /frontend)
├── Shared/
│   ├── OneWeb.Shared.Contracts/
│   └── OneWeb.Shared.Protos/
├── proto/                       # gRPC Proto files
└── docker-compose.yml
```

## 🔧 API Endpoints

### Auth
- `POST /api/v1/auth/send-otp` - Send OTP
- `POST /api/v1/auth/verify-otp` - Verify OTP & Login
- `POST /api/v1/auth/admin/login` - Admin login
- `POST /api/v1/auth/refresh-token` - Refresh token

### Services
- `GET /api/v1/services/categories` - Get categories
- `GET /api/v1/services` - List services (paginated)
- `GET /api/v1/services/{slug}` - Service details

### Orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders` - List orders
- `POST /api/v1/orders/{id}/status` - Update status

### Vendors
- `POST /api/v1/vendor/register` - Register as vendor
- `GET /api/v1/vendor/earnings` - View earnings

### Admin
- `GET /api/v1/admin/dashboard/stats` - Dashboard statistics
- `GET /api/v1/admin/orders` - Manage orders
- `GET /api/v1/admin/vendors` - Manage vendors
- `GET /api/v1/admin/users` - Manage users

## 🌐 Microservices Architecture

The project uses a microservices architecture with:
- **API Gateway** (OneWeb.Gateway) - Routes requests to microservices
- **Auth Service** - Authentication & user management
- **User Service** - User profile management
- **Catalog Service** - Service catalog management
- **Booking Service** - Order booking & management
- **Payment Service** - Payment processing
- **Content Service** - CMS, blogs, sliders

## 📱 Mobile App Support

- Endpoints return data compatible with mobile apps
- FCM push notifications supported
- SignalR for real-time updates

## 🔐 Environment Variables

See `.env.example` in each project directory.

## 📄 License

This project is licensed under the MIT License.

## 🤝 Support

For support, email support@oneweb.com or create an issue on GitHub.
