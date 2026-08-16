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
    ]
  },
}

export default nextConfig
