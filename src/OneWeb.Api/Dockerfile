# Build from the repository root:
#   docker build -f src/OneWeb.Api/Dockerfile -t oneweb-api .
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first, against project files only, so the layer caches across code edits.
COPY src/OneWeb.Domain/OneWeb.Domain.csproj           src/OneWeb.Domain/
COPY src/OneWeb.Infrastructure/OneWeb.Infrastructure.csproj src/OneWeb.Infrastructure/
COPY src/OneWeb.Application/OneWeb.Application.csproj src/OneWeb.Application/
COPY src/OneWeb.Api/OneWeb.Api.csproj                 src/OneWeb.Api/
RUN dotnet restore src/OneWeb.Api/OneWeb.Api.csproj

COPY src/ src/
RUN dotnet publish src/OneWeb.Api/OneWeb.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Run unprivileged.
RUN adduser --system --group --no-create-home oneweb
COPY --from=build /app ./
RUN mkdir -p wwwroot/UploadImage && chown -R oneweb:oneweb /app
USER oneweb

# All configuration arrives as environment variables (see .env.prod).
ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://+:5102 \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

EXPOSE 5102
ENTRYPOINT ["dotnet", "OneWeb.Api.dll"]
