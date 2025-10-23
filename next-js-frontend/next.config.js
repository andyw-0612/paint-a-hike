/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/search',
        destination: 'http://127.0.0.1:5000/api/search',
      },
    ];
  },
};

module.exports = nextConfig;