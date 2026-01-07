/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    // Force Turbopack to treat this folder as the workspace root
    root: '.',
  },
}

export default nextConfig
