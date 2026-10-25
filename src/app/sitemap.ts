import type { MetadataRoute } from "next";
import { tools } from "@/lib/tools-data";
import { blogPosts } from "@/lib/blog-data";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly",
    lastModified: Date = now
  ) => ({ url: `${SITE_URL}${path}`, lastModified, changeFrequency, priority });

  return [
    page("", 1, "weekly"),
    page("/tools", 0.9, "weekly"),
    ...tools.map((t) => page(t.href, 0.8)),
    page("/blog", 0.7, "weekly"),
    ...blogPosts.map((p) => page(`/blog/${p.slug}`, 0.6, "monthly", new Date(p.date))),
    page("/about", 0.4, "yearly"),
    page("/privacy", 0.3, "yearly"),
    page("/terms", 0.3, "yearly"),
  ];
}
