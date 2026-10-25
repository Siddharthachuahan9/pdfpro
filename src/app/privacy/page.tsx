import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Your files are processed in your browser and never uploaded. The site uses Vercel Analytics and Speed Insights, without cookies.",
  alternates: { canonical: "https://pdfkit.pro/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="wrap doc">
      <div className="doc__head">
        <h1>Privacy</h1>
        <p>Your files are processed in your browser and never uploaded.</p>
        <p className="doc__meta">Last updated 25 October 2026</p>
      </div>

      <div className="doc__body">
        <section aria-labelledby="p-files">
          <h2 id="p-files">Your files</h2>
          <p>
            Every tool on pdfkit.pro opens your files inside your browser tab and creates the result there. Your
            files are processed in the browser and never uploaded: they are not sent to pdfkit.pro or to anyone
            else, and nothing is stored on a server. When you close the tab, the copies the page held in memory are
            gone.
          </p>
        </section>

        <section aria-labelledby="p-analytics">
          <h2 id="p-analytics">Page views and performance</h2>
          <p>
            The site uses Vercel Analytics to count page views and Vercel Speed Insights to measure how quickly pages
            load. They record the page address, the site you came from, an approximate location (country and city),
            and your browser, operating system and device type. Neither sets cookies; their scripts never read or
            write one. Vercel tells visits apart with a hash of the request that is discarded after 24 hours, so you
            are not followed from day to day or across other sites.
          </p>
          <p>They never see your files or anything inside them.</p>
        </section>

        <section aria-labelledby="p-device">
          <h2 id="p-device">What stays on your device</h2>
          <p>
            Your choice of light or dark theme is saved in your browser&apos;s local storage. It never leaves your
            device.
          </p>
        </section>

        <section aria-labelledby="p-account">
          <h2 id="p-account">No accounts</h2>
          <p>There is no sign-up, so pdfkit.pro holds no names, email addresses or passwords.</p>
        </section>

        <section aria-labelledby="p-who" className="doc__panel">
          <h2 id="p-who">Who is responsible</h2>
          <p>
            pdfkit.pro is run by Siddhartha Chauhan. You can reach him through{" "}
            <a href="https://sidstack.in">sidstack.in</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
