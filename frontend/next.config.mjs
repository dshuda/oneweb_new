/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/web',
        destination: '/',
      },
      {
        source: '/web/:path*',
        destination: '/:path*',
      },
      {
        source: '/cdn/:path*',
        destination: 'http://127.0.0.1:5102/cdn/:path*',
      },
      {
        source: '/UploadImage/:path*',
        destination: 'http://127.0.0.1:5102/UploadImage/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5102/api/:path*',
      },
    ]
  },
}

export default nextConfig

