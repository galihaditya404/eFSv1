import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: false,
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/efs',
  output: 'standalone',
  allowedDevOrigins: [
    'loca.lt',
    '192.168.1.26',
    '192.168.1.33',
    '192.168.1.9',
    '192.168.1.11',
    '10.130.30.68',
    '10.126.30.191',
  ],
  turbopack: {}
};

export default withPWA(nextConfig);
