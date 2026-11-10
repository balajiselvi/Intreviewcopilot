/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NEXT_DIST_DIR lets a second mock/acceptance Next process avoid sharing .next-dev with :3102.
  distDir: process.env.NEXT_DIST_DIR
    || (process.env.NODE_ENV === 'development' ? '.next-dev' : '.next'),
};

export default nextConfig;
