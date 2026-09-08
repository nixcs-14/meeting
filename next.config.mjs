/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  
  // Désactiver le masquage des erreurs en production
  productionBrowserSourceMaps: true,
  
  // Logs détaillés
  logging: {
    level: 'verbose',
    fullUrl: true,
  },
  
  // Optimisations
  swcMinify: true,
  
  images: {
    unoptimized: true,
  },
  
  experimental: {
    serverActions: true,
  },
  
  // Webpack configuration pour plus de logs
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ne pas masquer les erreurs
      config.devtool = 'source-map';
    }
    return config;
  },
};

export default nextConfig;