/** @type {import('next').NextConfig} */
const nextConfig = {
  // CRITICAL FIX: Adding required 'sizes' property to bypass Vercel build error
  images: {
    // This setting prevents the Vercel/Next.js Image component from failing the build
    // when using fill or unoptimized images.
    sizes: "(max-width: 768px) 100vw, 50vw",
  },
  // Setting the turbopack root to the current directory to clear warnings
  // and resolve module issues (optional but recommended)
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
