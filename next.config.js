/** @type {import('next').NextConfig} */
const nextConfig = {
  // CRITICAL FIX: Adding required 'sizes' property to bypass Vercel build error

  // Setting the turbopack root to the current directory to clear warnings
  // and resolve module issues (optional but recommended)
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
