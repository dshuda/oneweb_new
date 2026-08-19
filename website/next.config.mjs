import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDir = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emits .next/standalone — a self-contained server with only the modules it
  // actually uses, so the production image stays small.
  output: 'standalone',
  // The repo root also has a package-lock.json, so Next infers a monorepo and
  // nests standalone output under website/. Pinning the tracing root keeps
  // server.js at the top of the bundle (and silences the workspace warning).
  outputFileTracingRoot: projectDir,
  // Serve under a sub-path (e.g. /web) when NEXT_BASE_PATH is set at build time.
  // Empty locally, so dev still runs at the root.
  basePath: process.env.NEXT_BASE_PATH || '',
  images: {
    unoptimized: true,
  },
  // Permissions-Policy is only honoured as an HTTP header (there is no <meta>
  // equivalent). In production nginx sets it for every path, so it is NOT set
  // here too — duplicate Permissions-Policy headers are ambiguous to browsers.
  // Local dev needs no policy: localhost is already a secure context and the
  // default policy allows geolocation for same-origin documents.
  experimental: {
    // Enables the View Transitions API on client-side navigations so the
    // category sidebar swaps pages with a smooth cross-fade + slide.
    viewTransition: true,
  },
}

export default nextConfig
