/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true }, // linted from the repo root (pnpm lint)
  transpilePackages: ['@learn-code/lesson-schema'],
  // Headers are configured per route. Lesson pages that run code will add
  // cross-origin isolation here later (E04) without touching `/`.
};

export default nextConfig;
