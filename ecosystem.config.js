module.exports = {
  apps: [
    {
      name: 'oneweb-backend',
      cwd: '/home/onetap/oneweb/publish',
      script: 'bash',
      args: ['-c', 'exec dotnet OneWeb.Api.dll'],
      interpreter: 'none',
      env: {
        ASPNETCORE_URLS: 'http://127.0.0.1:5102',
        ASPNETCORE_ENVIRONMENT: "Production",
        TZ: "Asia/Dhaka",
        FRONTEND_URL: "http://104.248.232.169",
        API_PUBLIC_BASE_URL: "http://104.248.232.169",
        PAYMENT_ALLOWED_RETURN_ORIGINS: "http://104.248.232.169",
        POSTGRES_HOST: "postgres",
        POSTGRES_PORT: "5432",
        POSTGRES_DB: "oneweb",
        POSTGRES_USER: "postgres",
        POSTGRES_PASSWORD: "KJFiMFjI9FCUtlBn5xYaKqrkIblP",
        CONNECTIONSTRINGS__DEFAULT: "Host=localhost;Port=5433;Database=oneweb;Username=postgres;Password=KJFiMFjI9FCUtlBn5xYaKqrkIblP",
        REDIS__CONNECTIONSTRING: "localhost:6379",
        JWT__SECRETKEY: "YourSuperSecretKeyHereMinimum32Characters!",
        JWT__ISSUER: "OneWeb",
        JWT__AUDIENCE: "OneWebUsers",
        JWT__ACCESSTOKENEXPIRYMINUTES: "60",
        JWT__REFRESHTOKENEXPIRYDAYS: "7",
        MASTERAUTH__ENABLED: "true",
        SSLWIRELESS_API_BASE: "https://smsplus.sslwireless.com",
        SSLWIRELESS_SID: "ONETAPSERVICEBRAND",
        SSLWIRELESS_API_KEY: "ngycabv6-uvz4o4o1-seg47hmg-xuswqyho-aa98j6ir",
        SSLWIRELESS_SENDER_ID: "ONETAPSERVICEBRAND",
        SSLWIRELESS_USER: "FHR",
        SSLWIRELESS_PASSWORD: "1234567",
        SSLWIRELESS_MESSAGE_TYPE: "EN",
        BULKSMS__SENDERID: "8809648908931",
        BULKSMS__API_KEY: "pUnGy1xfE77G1YicFYM7",
        SPACES_ACCESS_KEY_ID: "DO00DHT8X6EU2DGCWPWV",
        SPACES_SECRET_ACCESS_KEY: "QNWy2bRQHfwv8apH6b2yUD5wWGFUqIKLkTxfZOb7JNY",
        SPACES_BUCKET_NAME: "lcst",
        SPACES_REGION: "sgp1",
        SPACES_ENDPOINT: "https://sgp1.digitaloceanspaces.com",
        SPACES_CDN_ENDPOINT: "https://lcst.sgp1.cdn.digitaloceanspaces.com",
        SPACES_ROOT_FOLDER: "Onetap",
        NEXT_PUBLIC_API_URL: "http://104.248.232.169"
      }
    },
    {
      name: 'oneweb-web',
      cwd: '/home/onetap/oneweb/website',
      script: 'npm',
      args: 'run start -- -p 3001',
      env: {
        NODE_ENV: 'production',
        PORT: '3001'
      }
    },
    {
      name: 'oneweb-portal',
      cwd: '/home/onetap/oneweb/portal',
      script: 'npm',
      args: 'run start -- -p 3002',
      env: {
        NODE_ENV: 'production',
        PORT: '3002'
      }
    }
  ]
};
