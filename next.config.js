/** @[type] {import('next').NextConfig} */
const removeImports = require('next-remove-imports')();
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.experiments.topLevelAwait = true;
    return config;
  }
}

module.exports = removeImports(nextConfig);
