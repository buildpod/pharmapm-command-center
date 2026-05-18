/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/pharmapm-command-center/v2',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
