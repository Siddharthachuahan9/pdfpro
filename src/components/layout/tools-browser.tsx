"use client";

import { useId, useState } from "react";
import { ToolIndex } from "./tool-index";
import { matchTools } from "./tool-finder";

/** The tool index with a filter box above it. */
export function ToolsBrowser() {
  const id = useId();
  const [q, setQ] = useState("");
  const hits = matchTools(q);
  const only = q.trim() ? new Set(hits.map((t) => t.id)) : undefined;

  return (
    <div className="finder-page">
      <label className="vh" htmlFor={id}>
        Filter tools
      </label>
      <input
        id={id}
        type="search"
        placeholder="Filter tools, for example “jpg”"
        autoComplete="off"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="tools" style={{ marginTop: 40 }}>
        {hits.length ? (
          <ToolIndex only={only} />
        ) : (
          <p className="empty">No tool matches “{q.trim()}”. Try a shorter word.</p>
        )}
      </div>
    </div>
  );
}
