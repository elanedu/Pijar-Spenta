/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Izinkan gambar dari berbagai domain (untuk logo sekolah, avatar siswa DiceBear/Unsplash)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // Konfigurasi server & webpack untuk integrasi googleapis
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Pastikan modul server-side node tidak dibundel ke client browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
