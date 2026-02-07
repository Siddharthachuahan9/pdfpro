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
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL("https://pdfkit.pro"),
  title: {
    default: "PDFKit Pro - Free PDF Editor, Merge, Split, Compress and Chat with PDF",
    template: "%s | pdfkit.pro",
  },
  description:
    "Free online PDF editor. Merge, split, compress, edit and chat with PDF online. No signup. Privacy first.",
  verification: {
    google: "s8v6tSwpFyV4jO6y-LDeVOVgXSRGEawakx9wtD81G0A",
  },
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
    title: "PDFKit Pro - Free PDF Editor, Merge, Split, Compress and Chat with PDF",
    description:
      "Free online PDF editor. Merge, split, compress, edit and chat with PDF online. No signup. Privacy first.",
    url: "https://pdfkit.pro",
    siteName: "pdfkit.pro",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFKit Pro - Free PDF Editor, Merge, Split, Compress and Chat with PDF",
    description:
      "Free online PDF editor. Merge, split, compress, edit and chat with PDF online. No signup. Privacy first.",
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
        <Analytics />
      </body>
    </html>
  );
}
