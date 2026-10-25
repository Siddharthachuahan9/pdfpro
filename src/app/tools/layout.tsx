import type { Metadata } from "next";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";

const title = "All 20 Free PDF Tools";
const description =
  "Browse all 20 free PDF tools: merge, split, compress, convert, edit, sign, watermark, protect and more. Everything runs in your browser and files never leave your device.";

export const metadata: Metadata = {
  /* A plain string title here would stop the root "%s | pdfkit.pro" template
     from reaching the tool pages below, so restate the template. */
  title: { default: title, template: `%s | ${SITE_NAME}` },
  description,
  alternates: { canonical: `${SITE_URL}/tools` },
  openGraph: {
    title: `${title} | ${SITE_NAME}`,
    description,
    url: `${SITE_URL}/tools`,
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
