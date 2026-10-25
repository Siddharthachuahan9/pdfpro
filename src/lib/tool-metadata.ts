import type { Metadata } from "next";
import { getToolSEO } from "./seo-data";
import { getToolById } from "./tools-data";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "./site";

export function generateToolMetadata(toolId: string): Metadata {
  const seo = getToolSEO(toolId);
  const tool = getToolById(toolId);
  if (!seo || !tool) return {};

  // `title` is passed through the root template ("%s | pdfkit.pro"), so
  // metaTitle must not include the site suffix itself.
  const fullTitle = `${seo.metaTitle} | ${SITE_NAME}`;

  return {
    title: seo.metaTitle,
    description: seo.metaDescription,
    keywords: seo.keywords,
    openGraph: {
      title: fullTitle,
      description: seo.metaDescription,
      url: `${SITE_URL}${tool.href}`,
      type: "website",
      siteName: SITE_NAME,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: seo.metaDescription,
      images: [OG_IMAGE.url],
    },
    alternates: {
      canonical: `${SITE_URL}${tool.href}`,
    },
  };
}
