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
  // Mark ssh2 as external to avoid Turbopack bundling issues with native crypto
  serverExternalPackages: ['ssh2', 'ssh2-sftp-client'],
};

export default nextConfig;
