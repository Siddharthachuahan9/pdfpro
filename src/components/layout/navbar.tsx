import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ToolFinder } from "./tool-finder";
import { NavLink } from "./nav-link";

export function Navbar() {
  return (
    <header className="wrap top">
      <Link className="wm" href="/" aria-label="pdfkit.pro home">
        pdfkit.pro
      </Link>
      <nav className="top__nav" aria-label="Main">
        <ToolFinder />
        <NavLink href="/tools">All tools</NavLink>
        <ThemeToggle />
      </nav>
    </header>
  );
}
