/** @type {import('next').NextConfig} */
const nextConfig = {
  // Externalize heavy server-side libs so Vercel bundles them as Node modules,
  // not Edge-runtime JS. Required for 'docx' (uses Buffer/streams) and 'jspdf'.
  experimental: {
    serverComponentsExternalPackages: ['docx', 'jspdf', 'canvas'],
  },

  webpack: (config, { isServer }) => {
    // PDF.js needs canvas stubbed out in both client and server builds
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    // Suppress "Critical dependency" warning from pdfjs-dist dynamic require
    config.module = config.module || {};
    config.module.exprContextCritical = false;

    return config;
  },
};

module.exports = nextConfig;
