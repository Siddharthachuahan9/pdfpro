import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - pdfkit.pro",
  description: "Terms of Service for pdfkit.pro. Free browser-based PDF tools with no data collection.",
  alternates: { canonical: "https://pdfkit.pro/terms" },
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-16 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground">Last updated:</strong> January 2025
        </p>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing and using pdfkit.pro, you agree to these Terms of Service. If you do not agree, please do not use our services.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Service Description</h2>
          <p>
            pdfkit.pro provides free browser-based PDF tools including merging, splitting, compressing, converting, editing, and other PDF operations. All file processing occurs locally in your web browser. No files are uploaded to our servers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. No Account Required</h2>
          <p>
            Our tools are available without registration, login, or any form of account creation. There are no premium tiers or paid features.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Privacy & Data</h2>
          <p>
            We do not collect, store, or transmit any files you process using our tools. All PDF processing happens entirely within your browser using client-side JavaScript. We do not use cookies for tracking. See our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> for full details.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Intellectual Property</h2>
          <p>
            You retain all rights to the files you process using our tools. pdfkit.pro does not claim any ownership or rights over your content. The pdfkit.pro name, logo, and website design are the property of pdfkit.pro.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Disclaimer of Warranties</h2>
          <p>
            Our tools are provided &quot;as is&quot; without warranties of any kind. While we strive for accuracy and reliability, we cannot guarantee that the tools will be error-free or uninterrupted. Results may vary depending on your browser, device, and the PDF files being processed.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Limitation of Liability</h2>
          <p>
            pdfkit.pro shall not be liable for any damages arising from the use or inability to use our tools, including but not limited to data loss, file corruption, or any indirect, incidental, or consequential damages.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">8. Acceptable Use</h2>
          <p>
            You agree not to use our tools for any unlawful purpose or in any way that could damage, disable, or impair the website. You are solely responsible for ensuring you have the right to process the files you upload.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">9. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of pdfkit.pro after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">10. Contact</h2>
          <p>
            If you have questions about these terms, please reach out through our website.
          </p>
        </section>
      </div>
    </div>
  );
}
