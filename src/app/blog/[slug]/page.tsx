import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { blogPosts, getBlogPost } from "@/lib/blog-data";
import { getArticleSchema, getBreadcrumbSchema } from "@/lib/schemas";
import { toolCount } from "@/components/layout/tool-groups";

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

  const currentIdx = blogPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIdx > 0 ? blogPosts[currentIdx - 1] : null;
  const nextPost = currentIdx < blogPosts.length - 1 ? blogPosts[currentIdx + 1] : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="wrap">
        <article className="article">
          <Link className="back" href="/blog">
            All guides
          </Link>
          <h1>{post.title}</h1>
          <p className="post-meta">
            {post.category}, {post.readTime}, {post.date}
          </p>
          <div className="article__body">{renderContent(post.content)}</div>

          <nav className="article__nav" aria-label="More guides">
            {prevPost && (
              <Link href={`/blog/${prevPost.slug}`}>
                <span>Previous</span>
                <strong>{prevPost.title}</strong>
              </Link>
            )}
            {nextPost && (
              <Link className="article__next" href={`/blog/${nextPost.slug}`}>
                <span>Next</span>
                <strong>{nextPost.title}</strong>
              </Link>
            )}
          </nav>
          <p style={{ marginTop: 40 }}>
            <Link className="back" href="/tools">
              See all {toolCount} tools
            </Link>
          </p>
        </article>
      </div>
    </>
  );
}

/** Inline **bold** inside a line. */
function inline(text: string): React.ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part));
}

/** The posts are stored as light markdown; this turns them into headings, paragraphs and real lists. */
function renderContent(content: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let list: { ordered: boolean; items: React.ReactNode[] } | null = null;
  const flush = () => {
    if (!list) return;
    const key = `l${out.length}`;
    out.push(list.ordered ? <ol key={key}>{list.items}</ol> : <ul key={key}>{list.items}</ul>);
    list = null;
  };
  content.split("\n").forEach((raw, i) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^- (.*)/);
    const numbered = line.match(/^\d+\.\s(.*)/);
    if (bullet || numbered) {
      const ordered = !!numbered;
      if (!list || list.ordered !== ordered) {
        flush();
        list = { ordered, items: [] };
      }
      list.items.push(<li key={i}>{inline((bullet ?? numbered)![1])}</li>);
      return;
    }
    flush();
    if (line.startsWith("|") || line.trim() === "") return;
    if (line.startsWith("## ")) out.push(<h2 key={i}>{line.slice(3)}</h2>);
    else if (line.startsWith("### ")) out.push(<h3 key={i}>{line.slice(4)}</h3>);
    else if (line.startsWith("**Q:")) out.push(<h3 key={i}>{line.replace(/\*\*/g, "")}</h3>);
    else out.push(<p key={i}>{inline(line.replace(/^\*\*A:\*\*\s*/, "").replace(/^A:\s*/, ""))}</p>);
  });
  flush();
  return out;
}
