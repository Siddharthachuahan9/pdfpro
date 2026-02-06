import type { Metadata } from "next";
import { getToolSEO } from "./seo-data";
import { getToolById } from "./tools-data";

export function generateToolMetadata(toolId: string): Metadata {
  const seo = getToolSEO(toolId);
  const tool = getToolById(toolId);
  if (!seo || !tool) return {};

  return {
    title: seo.metaTitle,
    description: seo.metaDescription,
    keywords: seo.keywords,
    openGraph: {
      title: seo.metaTitle,
      description: seo.metaDescription,
      url: `https://pdfkit.pro${tool.href}`,
      type: "website",
      siteName: "pdfkit.pro",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.metaTitle,
      description: seo.metaDescription,
    },
    alternates: {
      canonical: `https://pdfkit.pro${tool.href}`,
    },
  };
}
