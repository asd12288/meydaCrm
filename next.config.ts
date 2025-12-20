import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow large file uploads for import functionality
    serverActions: {
      bodySizeLimit: '100MB',
    },
    // Middleware/proxy body size limit for large file uploads
    middlewareClientMaxBodySize: '100MB',
  },
};

export default nextConfig;
