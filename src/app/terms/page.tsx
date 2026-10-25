import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms for using pdfkit.pro, a set of free PDF tools that run in your browser.",
  alternates: { canonical: "https://pdfkit.pro/terms" },
};

const sections: { h: string; body: React.ReactNode }[] = [
  {
    h: "Using the site",
    body: "By using pdfkit.pro you agree to these terms. If you do not agree, please do not use the site.",
  },
  {
    h: "What the service is",
    body: "pdfkit.pro offers free tools for working with PDF files: merging, splitting, converting, editing and similar jobs. The tools run in your web browser. Your files are not uploaded to a server.",
  },
  {
    h: "No account, no charge",
    body: "The tools are free and need no registration. There are no paid tiers.",
  },
  {
    h: "Privacy",
    body: (
      <>
        Your files stay on your device. The site counts page views with Vercel Analytics and measures performance
        with Vercel Speed Insights, without cookies. The <Link href="/privacy">privacy page</Link> has the details.
      </>
    ),
  },
  {
    h: "Your files are yours",
    body: "You keep all rights to the files you open with the tools. pdfkit.pro claims no rights over them. The pdfkit.pro name and site design belong to pdfkit.pro.",
  },
  {
    h: "No warranty",
    body: "The tools are provided as they are, without any warranty. Results depend on your browser, your device and the files themselves, and a tool may get a file wrong. Keep your originals and check the result before you rely on it.",
  },
  {
    h: "Limitation of liability",
    body: "pdfkit.pro is not liable for any loss arising from using, or not being able to use, the tools, including lost or damaged files and any indirect or consequential loss.",
  },
  {
    h: "Fair use",
    body: "Do not use the tools for anything unlawful or in a way that could harm the site. You are responsible for having the right to work with the files you open.",
  },
  {
    h: "Changes",
    body: "These terms may change. Using the site after a change means you accept the new terms.",
  },
  {
    h: "Contact",
    body: (
      <>
        pdfkit.pro is run by Siddhartha Chauhan. You can reach him through <a href="https://sidstack.in">sidstack.in</a>.
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="wrap doc">
      <div className="doc__head">
        <h1>Terms of use</h1>
        <p>Plain terms for a free set of browser tools.</p>
        <p className="doc__meta">Last updated 25 October 2026</p>
      </div>
      <div className="doc__body">
        {sections.map((s, i) => (
          <section key={s.h} aria-labelledby={`t-${i}`}>
            <h2 id={`t-${i}`}>{s.h}</h2>
            <p>{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
