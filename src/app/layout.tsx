import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "pdfkit.pro - All-in-One PDF Toolkit",
  description:
    "Free browser-based PDF tools. Merge, split, compress, convert PDFs and more. No uploads, no signup. Everything runs locally in your browser.",
  keywords: [
    "PDF tools",
    "merge PDF",
    "split PDF",
    "compress PDF",
    "convert PDF",
    "browser PDF",
    "free PDF tools",
    "online PDF editor",
  ],
  openGraph: {
    title: "pdfkit.pro - All-in-One PDF Toolkit",
    description: "Free browser-based PDF tools. Fast. Private. No signup required.",
    type: "website",
  },
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
      </body>
    </html>
  );
}
