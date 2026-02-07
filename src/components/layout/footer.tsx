import Link from "next/link";
import { FileText, Heart, Shield, Zap, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                pdfkit<span className="gradient-text">.pro</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Free browser-based PDF tools. Fast, private, and no signup required.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Popular Tools</h4>
            <ul className="space-y-2">
              {["Merge PDF", "Split PDF", "Compress PDF", "PDF to JPG"].map((tool) => (
                <li key={tool}>
                  <Link
                    href={`/tools/${tool.toLowerCase().replace(/ /g, "-")}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {tool}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">More Tools</h4>
            <ul className="space-y-2">
              {["Edit PDF", "Chat with PDF", "Sign PDF", "Extract Text"].map((tool) => (
                <li key={tool}>
                  <Link
                    href={`/tools/${tool.toLowerCase().replace(/ /g, "-")}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {tool}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Company</h4>
            <ul className="space-y-2">
              {[
                { label: "About", href: "/about" },
                { label: "Blog", href: "/blog" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "All Tools", href: "/tools" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Product Hunt Support */}
        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-sm font-medium text-muted-foreground mb-4">
            Support us on Product Hunt 🚀
          </p>
          <a
            href="https://www.producthunt.com/posts/pdfkit-pro"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 transition-all duration-200 group"
          >
            <svg className="h-6 w-6 shrink-0" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="#DA552F"/>
              <path d="M22.667 20H17.333V14H22.667C24.324 14 25.667 15.343 25.667 17C25.667 18.657 24.324 20 22.667 20Z" fill="white"/>
              <path d="M14.667 26V14H22.667C24.324 14 25.667 15.343 25.667 17C25.667 18.657 24.324 20 22.667 20H17.333V26H14.667Z" fill="white"/>
            </svg>
            <span className="text-sm font-semibold text-orange-400 group-hover:text-orange-300 transition-colors">
              Upvote on Product Hunt
            </span>
          </a>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" /> Privacy First
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Browser Based
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Works Offline
              </span>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Built by Sidheart <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
