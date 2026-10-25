/* Word (.docx) → PDF. mammoth turns the document into semantic HTML; we walk
   that HTML block by block and lay it out with jsPDF, keeping headings,
   paragraphs, lists, bold/italic runs, simple tables and images. Exact Word
   layout (fonts, columns, floating objects) is not reproduced. */

type Run = { text: string; bold: boolean; italic: boolean };
type Block =
  | { kind: "text"; runs: Run[]; size: number; bold: boolean; indent: number; prefix?: string; spaceBefore: number; spaceAfter: number }
  | { kind: "image"; src: string }
  | { kind: "rule" };

const HEADING_SIZES: Record<string, number> = { h1: 20, h2: 16, h3: 14, h4: 12, h5: 11, h6: 11 };
const BODY_SIZE = 11;

function collectRuns(node: Node, bold: boolean, italic: boolean, out: Run[]) {
  if (node.nodeType === Node.TEXT_NODE) {
    const t = (node.textContent || "").replace(/\s+/g, " ");
    if (t) out.push({ text: t, bold, italic });
    return;
  }
  if (!(node instanceof HTMLElement)) return;
  const tag = node.tagName.toLowerCase();
  if (tag === "br") {
    out.push({ text: "\n", bold, italic });
    return;
  }
  if (tag === "img") return;
  const b = bold || tag === "strong" || tag === "b";
  const i = italic || tag === "em" || tag === "i";
  node.childNodes.forEach((c) => collectRuns(c, b, i, out));
}

function blocksFromHtml(html: string): Block[] {
  const root = document.createElement("div");
  root.innerHTML = html;
  const blocks: Block[] = [];

  const pushImages = (el: Element) => {
    el.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (src && src.startsWith("data:image/")) blocks.push({ kind: "image", src });
    });
  };

  const walk = (el: Element, listDepth: number) => {
    for (const child of Array.from(el.children)) {
      const tag = child.tagName.toLowerCase();
      if (tag in HEADING_SIZES) {
        const runs: Run[] = [];
        collectRuns(child, true, false, runs);
        blocks.push({ kind: "text", runs, size: HEADING_SIZES[tag], bold: true, indent: 0, spaceBefore: tag === "h1" ? 8 : 6, spaceAfter: 3 });
      } else if (tag === "p") {
        const runs: Run[] = [];
        collectRuns(child, false, false, runs);
        if (runs.some((r) => r.text.trim())) {
          blocks.push({ kind: "text", runs, size: BODY_SIZE, bold: false, indent: 0, spaceBefore: 0, spaceAfter: 4 });
        }
        pushImages(child);
      } else if (tag === "ul" || tag === "ol") {
        let n = 0;
        for (const li of Array.from(child.children)) {
          if (li.tagName.toLowerCase() !== "li") continue;
          n++;
          const runs: Run[] = [];
          /* text of the item itself, without nested lists */
          li.childNodes.forEach((c) => {
            if (c instanceof HTMLElement && /^(ul|ol)$/i.test(c.tagName)) return;
            collectRuns(c, false, false, runs);
          });
          blocks.push({
            kind: "text",
            runs,
            size: BODY_SIZE,
            bold: false,
            indent: 6 * (listDepth + 1),
            prefix: tag === "ol" ? `${n}.` : "•",
            spaceBefore: 0,
            spaceAfter: 2,
          });
          walk(li, listDepth + 1);
        }
        blocks.push({ kind: "text", runs: [], size: 4, bold: false, indent: 0, spaceBefore: 0, spaceAfter: 0 });
      } else if (tag === "table") {
        for (const tr of Array.from(child.querySelectorAll("tr"))) {
          const cells = Array.from(tr.children).map((td) => (td.textContent || "").replace(/\s+/g, " ").trim());
          blocks.push({
            kind: "text",
            runs: [{ text: cells.join("   |   "), bold: tr.querySelector("th") !== null, italic: false }],
            size: 10,
            bold: false,
            indent: 0,
            spaceBefore: 0,
            spaceAfter: 2,
          });
        }
        blocks.push({ kind: "rule" });
      } else if (tag === "img") {
        const src = child.getAttribute("src");
        if (src && src.startsWith("data:image/")) blocks.push({ kind: "image", src });
      } else {
        walk(child, listDepth);
      }
    }
  };
  walk(root, 0);
  return blocks;
}

function imageSize(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
}

export async function docxToPdf(file: File): Promise<Blob> {
  const mammoth = await import("mammoth");
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 56;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensure = (h: number) => {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };
  const fontStyle = (bold: boolean, italic: boolean) =>
    bold && italic ? "bolditalic" : bold ? "bold" : italic ? "italic" : "normal";

  for (const block of blocksFromHtml(html)) {
    if (block.kind === "rule") {
      y += 6;
      continue;
    }
    if (block.kind === "image") {
      try {
        const { w, h } = await imageSize(block.src);
        const scale = Math.min(1, contentW / (w * 0.75), (pageH - margin * 2) / (h * 0.75));
        const dw = w * 0.75 * scale;
        const dh = h * 0.75 * scale;
        ensure(dh);
        const fmt = /^data:image\/png/i.test(block.src) ? "PNG" : "JPEG";
        doc.addImage(block.src, fmt, margin, y, dw, dh);
        y += dh + 6;
      } catch {
        /* skip images the browser cannot decode (e.g. EMF) */
      }
      continue;
    }

    const lineH = block.size * 1.35;
    y += block.spaceBefore;
    const left = margin + block.indent + (block.prefix ? 14 : 0);
    const maxW = pageW - margin - left;

    /* Split runs into words while keeping their style, then wrap */
    const words: { text: string; bold: boolean; italic: boolean; br?: boolean }[] = [];
    for (const r of block.runs) {
      if (r.text === "\n") {
        words.push({ text: "", bold: r.bold, italic: r.italic, br: true });
        continue;
      }
      for (const piece of r.text.split(/(\s+)/)) {
        if (piece) words.push({ text: piece, bold: r.bold || block.bold, italic: r.italic });
      }
    }

    let line: typeof words = [];
    let lineW = 0;
    let first = true;
    const flush = () => {
      ensure(lineH);
      if (first && block.prefix) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(block.size);
        doc.text(block.prefix, margin + block.indent, y + block.size);
      }
      let x = left;
      /* drop trailing spaces */
      while (line.length && !line[line.length - 1].text.trim()) line.pop();
      for (const w of line) {
        doc.setFont("helvetica", fontStyle(w.bold, w.italic));
        doc.setFontSize(block.size);
        doc.text(w.text, x, y + block.size);
        x += doc.getTextWidth(w.text);
      }
      y += lineH;
      line = [];
      lineW = 0;
      first = false;
    };

    for (const w of words) {
      if (w.br) {
        flush();
        continue;
      }
      if (line.length === 0 && !w.text.trim()) continue; // no leading spaces
      doc.setFont("helvetica", fontStyle(w.bold, w.italic));
      doc.setFontSize(block.size);
      const ww = doc.getTextWidth(w.text);
      if (lineW + ww > maxW && line.length > 0 && w.text.trim()) flush();
      line.push(w);
      lineW += ww;
    }
    if (line.length || first) {
      if (line.length) flush();
      else if (block.runs.length) y += lineH;
    }
    y += block.spaceAfter;
  }

  return doc.output("blob");
}
