import type { Metadata } from "next";
import Link from "next/link";
import { toolCount } from "@/components/layout/tool-groups";

export const metadata: Metadata = {
  title: "About",
  description: "What pdfkit.pro is, how its tools work in your browser, what they cannot do yet, and who builds it.",
  alternates: { canonical: "https://pdfkit.pro/about" },
};

export default function AboutPage() {
  return (
    <div className="wrap doc">
      <div className="doc__head">
        <h1>About pdfkit.pro</h1>
        <p>{toolCount} free PDF tools that do their work in your browser tab.</p>
      </div>

      <div className="doc__body">
        <section aria-labelledby="a-what">
          <h2 id="a-what">What it is</h2>
          <p>
            pdfkit.pro is a set of small tools for everyday PDF jobs: joining files, splitting them, turning pages,
            converting images and Word documents, adding page numbers, a watermark or a signature. There is no
            account, no trial and no paid tier.
          </p>
        </section>

        <section aria-labelledby="a-how">
          <h2 id="a-how">How it works</h2>
          <p>
            When you choose a file, the page reads it inside your browser and writes the result there, using open
            source libraries: pdf-lib for building and changing PDFs, PDF.js for reading and drawing pages, mammoth
            and jsPDF for Word to PDF. Your files are not sent to a server, so there is nothing stored to delete
            afterwards.
          </p>
          <p>
            The site itself counts page views with Vercel Analytics. The <Link href="/privacy">privacy page</Link>{" "}
            says exactly what that means.
          </p>
        </section>

        <section aria-labelledby="a-limits">
          <h2 id="a-limits">What it cannot do yet</h2>
          <ul>
            <li>Read scanned pages. Extract Text and PDF to Word only see text a PDF already contains.</li>
            <li>Answer questions like an AI. Chat with PDF searches your PDF&apos;s text for the words you type.</li>
            <li>Shrink files a lot. Compress re-saves the file, which usually saves a little.</li>
          </ul>
        </section>

        <section aria-labelledby="a-who" className="doc__panel">
          <h2 id="a-who">Who builds it</h2>
          <p>
            pdfkit.pro is built by Siddhartha Chauhan. More of his work is at{" "}
            <a href="https://sidstack.in">sidstack.in</a>.
          </p>
          <p>
            <Link href="/tools">See all {toolCount} tools</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
