import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { blogPosts, getBlogPost } from "@/lib/blog-data";
import { getArticleSchema, getBreadcrumbSchema } from "@/lib/schemas";
import { ArrowLeft, Clock, Tag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Not Found" };

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      type: "article",
      publishedTime: post.date,
      authors: ["Sidheart"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDescription,
    },
    alternates: {
      canonical: `https://pdfkit.pro/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const articleSchema = getArticleSchema(post.title, post.metaDescription, slug, post.date);
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "https://pdfkit.pro" },
    { name: "Blog", url: "https://pdfkit.pro/blog" },
    { name: post.title, url: `https://pdfkit.pro/blog/${slug}` },
  ]);

  // Simple markdown-ish rendering
  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return <h2 key={i} className="text-2xl font-bold mt-8 mb-4">{line.slice(3)}</h2>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={i} className="text-lg font-semibold mt-6 mb-3">{line.slice(4)}</h3>;
      }
      if (line.startsWith("- **")) {
        const match = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
        if (match) {
          return (
            <div key={i} className="flex gap-2 ml-4 mb-1.5">
              <span className="text-primary mt-1">•</span>
              <p className="text-sm text-muted-foreground"><strong className="text-foreground">{match[1]}</strong>{match[2] ? `: ${match[2]}` : ""}</p>
            </div>
          );
        }
      }
      if (line.startsWith("- ")) {
        return (
          <div key={i} className="flex gap-2 ml-4 mb-1.5">
            <span className="text-primary mt-1">•</span>
            <p className="text-sm text-muted-foreground">{line.slice(2)}</p>
          </div>
        );
      }
      if (line.match(/^\d+\.\s\*\*/)) {
        const match = line.match(/^(\d+)\.\s\*\*(.+?)\*\*\s*[-—]\s*(.*)/);
        if (match) {
          return (
            <div key={i} className="flex gap-2 ml-4 mb-1.5">
              <span className="text-primary font-medium">{match[1]}.</span>
              <p className="text-sm text-muted-foreground"><strong className="text-foreground">{match[2]}</strong> — {match[3]}</p>
            </div>
          );
        }
      }
      if (line.match(/^\d+\.\s/)) {
        const match = line.match(/^(\d+)\.\s(.*)/);
        if (match) {
          return (
            <div key={i} className="flex gap-2 ml-4 mb-1.5">
              <span className="text-primary font-medium">{match[1]}.</span>
              <p className="text-sm text-muted-foreground">{match[2]}</p>
            </div>
          );
        }
      }
      if (line.startsWith("**Q:")) {
        return <p key={i} className="text-sm font-semibold mt-4 mb-1">{line.replace(/\*\*/g, "")}</p>;
      }
      if (line.startsWith("**A:") || line.startsWith("A:")) {
        return <p key={i} className="text-sm text-muted-foreground mb-3 ml-4">{line.replace(/\*\*/g, "")}</p>;
      }
      if (line.startsWith("|")) {
        return null; // Skip markdown tables for simplicity
      }
      if (line.trim() === "") {
        return <div key={i} className="h-3" />;
      }
      // Render inline bold
      const parts = line.split(/\*\*(.+?)\*\*/g);
      return (
        <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-2">
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-foreground">{part}</strong> : part)}
        </p>
      );
    });
  };

  const currentIdx = blogPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIdx > 0 ? blogPosts[currentIdx - 1] : null;
  const nextPost = currentIdx < blogPosts.length - 1 ? blogPosts[currentIdx + 1] : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground mb-6">
              <ArrowLeft className="h-4 w-4" />
              All Articles
            </Button>
          </Link>

          <article>
            <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{post.category}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
              <span>{post.date}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-6">{post.title}</h1>

            <div className="prose-custom">
              {renderContent(post.content)}
            </div>
          </article>

          {/* Navigation */}
          <div className="mt-12 pt-8 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevPost && (
              <Link href={`/blog/${prevPost.slug}`} className="group rounded-xl border border-border p-4 hover:border-primary/50 transition-all">
                <span className="text-xs text-muted-foreground">Previous</span>
                <p className="text-sm font-medium group-hover:text-primary transition-colors mt-1">{prevPost.title}</p>
              </Link>
            )}
            {nextPost && (
              <Link href={`/blog/${nextPost.slug}`} className="group rounded-xl border border-border p-4 hover:border-primary/50 transition-all sm:text-right sm:ml-auto">
                <span className="text-xs text-muted-foreground">Next</span>
                <p className="text-sm font-medium group-hover:text-primary transition-colors mt-1">{nextPost.title}</p>
              </Link>
            )}
          </div>

          {/* CTA */}
          <div className="mt-12 glass rounded-2xl p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Ready to Try These Tools?</h2>
            <p className="text-sm text-muted-foreground mb-4">All 20+ PDF tools are free to use, with no signup required.</p>
            <Link href="/tools">
              <Button className="gap-2">
                Explore All Tools <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
