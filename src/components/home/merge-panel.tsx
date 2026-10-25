"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getPDFPageCount, mergePDFs } from "@/lib/pdf/pdf-utils";
import { renderPDFPageToCanvas } from "@/lib/pdf/pdf-render";
import { downloadPDF } from "@/lib/utils";

interface Item {
  id: number;
  file: File;
  pages: number | null;
  err: string | null;
  thumb: string | null;
}

const isPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);
const fmt = (b: number) =>
  b < 1048576 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1)} MB`;

const Up = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
);
const Down = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 5v14M5 12l7 7 7-7" />
  </svg>
);
const Cross = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

/** Two small sample PDFs made on this device with pdf-lib, so the panel can be tried without files to hand. */
async function makeSamples(): Promise<File[]> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const make = async (title: string, n: number) => {
    const d = await PDFDocument.create();
    const f = await d.embedFont(StandardFonts.Helvetica);
    for (let i = 1; i <= n; i++) {
      const p = d.addPage([595, 842]);
      p.drawRectangle({ x: 0, y: 772, width: 595, height: 70, color: rgb(0.85, 0.17, 0.13) });
      p.drawText(title, { x: 48, y: 720, size: 28, font: f, color: rgb(0.04, 0.04, 0.04) });
      p.drawText(`Page ${i} of ${n}`, { x: 48, y: 690, size: 14, font: f, color: rgb(0.4, 0.4, 0.4) });
      for (let l = 0; l < 14; l++)
        p.drawRectangle({ x: 48, y: 640 - l * 34, width: 499 - (l % 3) * 80, height: 8, color: rgb(0.88, 0.88, 0.88) });
    }
    const bytes = await d.save();
    return new File([bytes.buffer as ArrayBuffer], `${title.toLowerCase().replace(/\s+/g, "-")}.pdf`, {
      type: "application/pdf",
    });
  };
  return [await make("Sample letter", 2), await make("Sample invoice", 3)];
}

/**
 * The Merge tool at actual size on the home screen. It runs the same code as /tools/merge
 * (mergePDFs from src/lib/pdf), in this tab, and starts a normal download.
 */
export function MergePanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "" | "ok" | "bad" } | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [dropBefore, setDropBefore] = useState<number | null>(null);
  const uid = useRef(0);
  const drop = useRef<HTMLDivElement>(null);

  const patch = (id: number, p: Partial<Item>) =>
    setItems((list) => list.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const add = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).filter(isPdf);
    if (!list.length) {
      setMessage({ text: "Those were not PDF files. Choose files ending in .pdf.", tone: "bad" });
      return;
    }
    setMessage(null);
    const fresh = list.map((file) => ({ id: ++uid.current, file, pages: null, err: null, thumb: null }));
    setItems((prev) => [...prev, ...fresh]);
    for (const it of fresh) {
      try {
        const pages = await getPDFPageCount(it.file);
        patch(it.id, { pages });
        renderPDFPageToCanvas(it.file, 1, 0.2)
          .then((thumb) => patch(it.id, { thumb }))
          .catch(() => {});
      } catch (e) {
        patch(it.id, {
          err: /encrypt/i.test(String(e))
            ? "Password-protected. Merge cannot open it."
            : "This file could not be read as a PDF.",
        });
      }
    }
  }, []);

  // A PDF dropped anywhere on the home page lands here instead of opening in the browser.
  useEffect(() => {
    const hasFiles = (e: DragEvent) => !!e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files");
    const onOver = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e) || drop.current?.contains(e.target as Node)) return;
      e.preventDefault();
      if (e.dataTransfer?.files.length) add(e.dataTransfer.files);
    };
    document.addEventListener("dragover", onOver);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragover", onOver);
      document.removeEventListener("drop", onDrop);
    };
  }, [add]);

  const move = (from: number, to: number) => {
    setMessage(null);
    setItems((list) => {
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
  };

  const ok = items.filter((x) => !x.err && x.pages != null);
  const pages = ok.reduce((a, x) => a + (x.pages ?? 0), 0);
  const reading = items.some((x) => x.pages == null && !x.err);
  const bad = items.some((x) => x.err);
  const ready = ok.length >= 2 && !reading && !bad && !busy;

  let status: { text: string; tone: "" | "ok" | "bad" };
  if (busy) status = { text: `Merging ${ok.length} files…`, tone: "" };
  else if (message) status = message;
  else if (items.length === 0) status = { text: "Add at least two PDFs to merge.", tone: "" };
  else if (reading) status = { text: "Reading files…", tone: "" };
  else if (bad) status = { text: "Remove the file marked in red to continue.", tone: "bad" };
  else if (ok.length < 2) status = { text: "Add one more PDF to merge.", tone: "" };
  else status = { text: `Ready. The merged file will have ${pages} pages.`, tone: "" };

  const merge = async () => {
    if (!ready) return;
    setBusy(true);
    setMessage(null);
    try {
      const bytes = await mergePDFs(ok.map((x) => x.file));
      downloadPDF(bytes, "merged.pdf");
      setMessage({ text: `Done: merged.pdf, ${pages} pages, ${fmt(bytes.length)}. The download has started.`, tone: "ok" });
    } catch (e) {
      setMessage({
        text: `The merge stopped${e instanceof Error && e.message ? `: ${e.message}` : ""}. Try again, or remove the last file you added.`,
        tone: "bad",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mk" data-ui aria-labelledby="mk-h">
      <div className="mk__head">
        <h2 id="mk-h">Merge PDF</h2>
        <Link className="mk__open" href="/tools/merge">
          Open on its own page
        </Link>
      </div>
      <p className="mk__sub">Join PDFs into one file, right here in this tab.</p>

      <div
        ref={drop}
        className={`dz${over ? " is-over" : ""}`}
        onDragEnter={(e) => {
          if (dragId != null) return;
          e.preventDefault();
          setOver(true);
        }}
        onDragOver={(e) => {
          if (dragId != null) return;
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          setOver(false);
          if (dragId != null) return;
          e.preventDefault();
          add(e.dataTransfer.files);
        }}
      >
        <b>Drop PDFs here</b>
        <small>Two or more. They stay on this device.</small>
        <div className="dz__acts">
          <label className="ubtn">
            Choose PDFs
            <input
              className="vh"
              type="file"
              accept="application/pdf,.pdf"
              multiple
              onChange={(e) => {
                if (e.target.files) add(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <button className="lnk" type="button" onClick={async () => add(await makeSamples())}>
            Try two sample PDFs
          </button>
        </div>
      </div>

      {items.length > 0 ? (
        <ol
          className="rows"
          aria-label="Files in merge order"
          onDragOver={(e) => {
            if (dragId == null) return;
            e.preventDefault();
            const li = (e.target as HTMLElement).closest("li");
            setDropBefore(li ? Number(li.dataset.id) : null);
          }}
          onDrop={(e) => {
            if (dragId == null) return;
            e.preventDefault();
            e.stopPropagation();
            const from = items.findIndex((x) => x.id === dragId);
            let to = items.length - 1;
            if (dropBefore != null) {
              to = items.findIndex((x) => x.id === dropBefore);
              if (to > from) to -= 1;
            }
            if (from >= 0 && to >= 0) move(from, to);
            setDragId(null);
            setDropBefore(null);
          }}
        >
          {items.map((it, i) => (
            <li
              key={it.id}
              data-id={it.id}
              draggable
              className={`frow${dragId === it.id ? " dragging" : ""}${dropBefore === it.id && dragId !== it.id ? " drop-before" : ""}`}
              onDragStart={(e) => {
                setDragId(it.id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", String(it.id));
              }}
              onDragEnd={() => {
                setDragId(null);
                setDropBefore(null);
              }}
            >
              <span className="thumb">
                {/* eslint-disable-next-line @next/next/no-img-element -- a local data URL rendered from the file */}
                {it.thumb && <img src={it.thumb} alt="" />}
              </span>
              <span className="fname">
                <b>{it.file.name}</b>
                <small className={it.err ? "err" : undefined}>
                  {it.err ??
                    (it.pages == null
                      ? "Reading…"
                      : `${it.pages} ${it.pages === 1 ? "page" : "pages"}, ${fmt(it.file.size)}`)}
                </small>
              </span>
              <span className="racts">
                <button className="ib" type="button" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={`Move ${it.file.name} up`}>
                  <Up />
                </button>
                <button
                  className="ib"
                  type="button"
                  disabled={i === items.length - 1}
                  onClick={() => move(i, i + 1)}
                  aria-label={`Move ${it.file.name} down`}
                >
                  <Down />
                </button>
                <button
                  className="ib"
                  type="button"
                  onClick={() => {
                    setMessage(null);
                    setItems((list) => list.filter((x) => x.id !== it.id));
                  }}
                  aria-label={`Remove ${it.file.name}`}
                >
                  <Cross />
                </button>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty">No files yet. They are joined in the order listed here, and you can reorder them.</p>
      )}

      <div className="mk__foot">
        <button className="btn" type="button" disabled={!ready} onClick={merge}>
          {busy ? "Merging…" : ok.length >= 2 ? `Merge ${ok.length} PDFs, ${pages} pages` : "Merge PDFs"}
        </button>
        <p className={`status ${status.tone}`} role="status">
          {status.text}
        </p>
      </div>
    </section>
  );
}
