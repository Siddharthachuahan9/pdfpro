import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Old/label-derived slugs (e.g. footer "Merge PDF" -> /tools/merge-pdf) that
  // don't match the real routes. Keep them working for existing links.
  async redirects() {
    const legacy: Record<string, string> = {
      "merge-pdf": "merge",
      "split-pdf": "split",
      "compress-pdf": "compress",
      "rotate-pdf": "rotate",
      "add-watermark": "watermark",
      "watermark-pdf": "watermark",
    };
    return [
      ...Object.entries(legacy).map(([from, to]) => ({
        source: `/tools/${from}`,
        destination: `/tools/${to}`,
        permanent: true,
      })),
      // Blog post renamed (the tool is keyword search, not AI).
      {
        source: "/blog/how-to-chat-with-pdf-using-ai",
        destination: "/blog/how-to-chat-with-pdf",
        permanent: true,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

export default nextConfig;
