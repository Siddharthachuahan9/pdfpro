import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { JsonLd } from "@/components/seo/json-ld";
import {
  getWebsiteSchema,
  getOrganizationSchema,
  getSoftwareAppSchema,
} from "@/lib/schemas";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  metadataBase: new URL("https://pdfkit.pro"),
  title: {
    default: "pdfkit.pro - Free Online PDF Tools | Edit, Merge, Compress PDF",
    template: "%s | pdfkit.pro",
  },
  description:
    "Free browser-based PDF tools. Merge, split, compress, convert, edit, sign, and chat with PDFs. No uploads, no signup. 100% private — everything runs locally in your browser.",
  keywords: [
    "PDF tools",
    "merge PDF",
    "split PDF",
    "compress PDF",
    "convert PDF",
    "edit PDF online",
    "free PDF editor",
    "browser PDF tools",
    "online PDF tools",
    "PDF to JPG",
    "chat with PDF",
    "AI PDF tools",
    "sign PDF",
    "watermark PDF",
  ],
  authors: [{ name: "Sidheart" }],
  creator: "Sidheart",
  publisher: "pdfkit.pro",
  openGraph: {
    title: "pdfkit.pro - Free Online PDF Tools",
    description:
      "20+ free browser-based PDF tools. Edit, merge, compress, convert PDFs and more. Fast, private, no signup.",
    url: "https://pdfkit.pro",
    siteName: "pdfkit.pro",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "pdfkit.pro - Free Online PDF Tools",
    description:
      "20+ free browser-based PDF tools. Edit, merge, compress, convert PDFs. Fast, private, no signup.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://pdfkit.pro",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
        <JsonLd data={getWebsiteSchema()} />
        <JsonLd data={getOrganizationSchema()} />
        <JsonLd data={getSoftwareAppSchema()} />
        <SpeedInsights />
      </body>
    </html>
  );
}
