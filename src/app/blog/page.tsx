import Link from "next/link";
import type { Metadata } from "next";
import { blogPosts } from "@/lib/blog-data";
import { ArrowRight, Clock, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog - PDF Tips, Guides & Tutorials | pdfkit.pro",
  description: "Learn how to edit, merge, compress, and convert PDFs. Free guides, tips, and tutorials from pdfkit.pro.",
  openGraph: {
    title: "Blog - PDF Tips & Guides | pdfkit.pro",
    description: "Free PDF guides, tips, and tutorials.",
    type: "website",
  },
};

export default function BlogPage() {
  return (
    <div className="py-12 md:py-20">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            PDF Tips & Guides
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Learn how to get the most out of your PDF documents with free guides and tutorials.
          </p>
        </div>

        <div className="space-y-6">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <article className="group rounded-xl border border-border p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-300 bg-card mb-6">
                <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readTime}
                  </span>
                  <span>{post.date}</span>
                </div>
                <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {post.excerpt}
                </p>
                <span className="text-sm text-primary font-medium flex items-center gap-1">
                  Read article <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
