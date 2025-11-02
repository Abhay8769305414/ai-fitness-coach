/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    domains: ['placeholder.com', 'via.placeholder.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Ensure output is set to export for static deployments if needed
  // output: 'export', // Uncomment if you need static export
};

module.exports = nextConfig;