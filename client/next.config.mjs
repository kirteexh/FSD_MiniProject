/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://fsd-miniproject-skab.onrender.com/api',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'https://fsd-miniproject-skab.onrender.com',
    NEXT_PUBLIC_DEMO: process.env.NEXT_PUBLIC_DEMO || 'true',
  },
};

export default nextConfig;
