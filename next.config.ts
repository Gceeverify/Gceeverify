import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keep the always-on process small. Railway bills memory by the minute.
  cacheMaxMemorySize: 16 * 1024 * 1024,
  experimental: {
    // Load route modules on demand instead of retaining every page at startup.
    preloadEntriesOnStart: false,
  },
  images: {
    // These images are versioned in the repository, so a long optimizer cache
    // avoids repeating the same CPU work and transfer on every visit.
    minimumCacheTTL: 2_678_400,
  },
};

export default nextConfig;
