import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDir = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle for deployment.
  output: 'standalone',
  // The repo root has its own package-lock.json, so Next would infer a monorepo
  // and nest the standalone output under portal/. Pin the tracing root.
  outputFileTracingRoot: projectDir,
  // Served under /portal in production; empty locally.
  basePath: process.env.NEXT_BASE_PATH || '',
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5102'}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
