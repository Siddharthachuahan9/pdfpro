"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { allTools, type ToolEntry } from "./tool-groups";

export function matchTools(query: string): ToolEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return allTools;
  const words = q.split(/\s+/);
  return allTools.filter((t) => {
    const hay = `${t.name} ${t.blurb} ${t.group}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

/** Type a few letters, see the matching tools, press Enter for the first one. */
export function ToolFinder() {
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const hits = q.trim() ? matchTools(q).slice(0, 8) : [];
  const show = open && q.trim().length > 0;

  const go = (t: ToolEntry | undefined) => {
    if (!t) return;
    setOpen(false);
    setQ("");
    router.push(t.href);
  };

  return (
    <div
      className="finder"
      ref={box}
      onBlur={(e) => {
        if (!box.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <label className="vh" htmlFor={`${id}-q`}>
        Find a tool
      </label>
      <input
        id={`${id}-q`}
        type="search"
        placeholder="Find a tool"
        autoComplete="off"
        role="combobox"
        aria-expanded={show}
        aria-controls={`${id}-list`}
        aria-activedescendant={show && hits[active] ? `${id}-${hits[active].id}` : undefined}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, Math.max(hits.length - 1, 0)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            go(hits[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {show && (
        <ul id={`${id}-list`} role="listbox" aria-label="Matching tools">
          {hits.length === 0 && <li className="finder__none">No tool matches “{q.trim()}”.</li>}
          {hits.map((t, i) => (
            <li key={t.id} role="presentation">
              <Link
                id={`${id}-${t.id}`}
                role="option"
                aria-selected={i === active}
                href={t.href}
                onClick={() => {
                  setOpen(false);
                  setQ("");
                }}
                onMouseEnter={() => setActive(i)}
              >
                {t.name}
                <small>{t.blurb}</small>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
