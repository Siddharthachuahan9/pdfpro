import type { Metadata } from "next";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";

const title = "Privacy Policy";
const description =
  "Files never leave your device: every pdfkit.pro tool processes PDFs in your browser. The site counts page views with Vercel Analytics.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/privacy` },
  openGraph: {
    title: `${title} | ${SITE_NAME}`,
    description,
    url: `${SITE_URL}/privacy`,
    siteName: SITE_NAME,
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [OG_IMAGE.url],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
