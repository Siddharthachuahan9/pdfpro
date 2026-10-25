import Link from "next/link";
import type { Metadata } from "next";
import { blogPosts } from "@/lib/blog-data";

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
    <div className="wrap doc">
      <div className="doc__head">
        <h1>Guides</h1>
        <p>Short how-tos for everyday PDF jobs.</p>
      </div>
      <ul className="posts">
        {blogPosts.map((post) => (
          <li key={post.slug}>
            <Link className="post-link" href={`/blog/${post.slug}`}>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <p className="post-meta">
                {post.category}, {post.readTime}, {post.date}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
