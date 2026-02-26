const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["mammoth", "jsdom", "sanitize-html"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
