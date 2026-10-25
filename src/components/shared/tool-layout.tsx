"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toolByHref, toolGroups } from "@/components/layout/tool-groups";

interface ToolLayoutProps {
  title: string;
  description: string;
  /** Kept for the tool pages that still pass them; the screen no longer draws an icon tile. */
  icon?: LucideIcon;
  color?: string;
  children: React.ReactNode;
  processing?: boolean;
  progress?: number;
}

/**
 * Every tool screen: the tool's name, one line saying what it does, then the tool itself
 * (the upload area comes first in each page's children), with progress shown while it works.
 */
export function ToolLayout({ title, description, children, processing = false, progress = 0 }: ToolLayoutProps) {
  const pathname = usePathname();
  const entry = toolByHref(pathname);
  const line = entry?.blurb ?? description;
  const group = entry ? toolGroups.find((g) => g.name === entry.group) : undefined;
  const siblings = group ? group.tools.filter((t) => t.id !== entry?.id) : [];
  const moreLabel = group?.name === "Other" ? "Other tools" : `More in ${group?.name}`;

  return (
    <div className="wrap tool-screen">
      <div className="tool-head">
        <Link className="back" href="/tools">
          All tools
        </Link>
        <h1>{title}</h1>
        <p>{line}.</p>
        <p className="tool-note">Runs in this browser tab. Your files are not uploaded.</p>
        {siblings.length > 0 && (
          <nav className="tool-more" aria-label={moreLabel}>
            <h2>{moreLabel}</h2>
            <ul>
              {siblings.map((t) => (
                <li key={t.id}>
                  <Link href={t.href}>{t.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      <div className="tool-main">
        {processing && (
          <div className="tool-progress" role="status">
            <div className="tool-progress__row">
              <span>Working…</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}
        <div className="tool-body">{children}</div>
      </div>
    </div>
  );
}
