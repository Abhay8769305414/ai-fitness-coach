/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Add allowed remote domains for next/image optimization
    domains: ["images.unsplash.com", "source.unsplash.com", "example.com"],
    // Valid Next.js keys for responsive images
    deviceSizes: [320, 420, 768, 1024, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
