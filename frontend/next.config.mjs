/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://jeanene-unexposed-ingrid.ngrok-free.dev/api/:path*',
      },
    ];
  },
};

export default nextConfig;
