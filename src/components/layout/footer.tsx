import Link from "next/link";
import { allTools, toolCount } from "./tool-groups";

const popular = ["merge", "split", "compress", "pdf-to-jpg", "jpg-to-pdf", "edit-pdf", "sign-pdf"];

export function Footer() {
  const picks = popular
    .map((id) => allTools.find((t) => t.id === id))
    .filter((t): t is (typeof allTools)[number] => Boolean(t));

  return (
    <footer className="wrap foot">
      <nav className="foot__tools" aria-label="Popular tools">
        <Link href="/tools">All {toolCount} tools</Link>
        {picks.map((t) => (
          <Link key={t.id} href={t.href}>
            {t.name}
          </Link>
        ))}
      </nav>
      <p>
        Built by Siddhartha Chauhan, <a href="https://sidstack.in">sidstack.in</a>
      </p>
      <nav aria-label="Site">
        <Link href="/about">About</Link>
        <Link href="/blog">Blog</Link>
        <a href="https://www.producthunt.com/posts/pdfkit-pro" rel="noopener noreferrer" target="_blank">
          Product Hunt
        </a>
        <Link href="/terms">Terms</Link>
      </nav>
      <p className="r">
        {new Date().getFullYear()} pdfkit.pro, <Link href="/privacy">Privacy</Link>
      </p>
    </footer>
  );
}
