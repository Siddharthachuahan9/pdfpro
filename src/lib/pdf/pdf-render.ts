let pdfjsLib: typeof import("pdfjs-dist") | null = null;

async function getPdfjs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).toString();
  return pdfjsLib;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderPage(page: any, scale: number) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;

  // pdfjs-dist v5 requires canvas in render params
  return {
    canvas,
    promise: page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    } as Parameters<typeof page.render>[0]).promise,
  };
}

export async function renderPDFPageToCanvas(
  file: File,
  pageNum: number,
  scale: number = 1.5
): Promise<string> {
  const pdfjs = await getPdfjs();
  const bytes = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const page = await pdf.getPage(pageNum);
  const { canvas, promise } = renderPage(page, scale);
  await promise;
  return canvas.toDataURL("image/jpeg", 0.85);
}

export async function renderAllPDFPages(
  file: File,
  scale: number = 1.0
): Promise<string[]> {
  const pdfjs = await getPdfjs();
  const bytes = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const results: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const { canvas, promise } = renderPage(page, scale);
    await promise;
    results.push(canvas.toDataURL("image/jpeg", 0.85));
  }

  return results;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjs = await getPdfjs();
  const bytes = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
  }

  return fullText;
}

export async function pdfToImages(
  file: File,
  format: "jpeg" | "png" = "jpeg",
  quality: number = 0.85,
  scale: number = 2.0
): Promise<{ data: string; filename: string }[]> {
  const pdfjs = await getPdfjs();
  const bytes = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const results: { data: string; filename: string }[] = [];

  const mimeType = format === "png" ? "image/png" : "image/jpeg";
  const ext = format === "png" ? "png" : "jpg";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const { canvas, promise } = renderPage(page, scale);
    await promise;

    const dataUrl = canvas.toDataURL(mimeType, quality);
    results.push({
      data: dataUrl,
      filename: `page-${i}.${ext}`,
    });
  }

  return results;
}

/* Render one page for an on-screen preview and report the page count */
export async function renderPDFPagePreview(
  file: File,
  pageNum: number,
  scale: number = 1.5
): Promise<{ dataUrl: string; numPages: number; width: number; height: number }> {
  const pdfjs = await getPdfjs();
  const bytes = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const page = await pdf.getPage(Math.min(Math.max(1, pageNum), pdf.numPages));
  const base = page.getViewport({ scale: 1 });
  const { canvas, promise } = renderPage(page, scale);
  await promise;
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  const numPages = pdf.numPages;
  await pdf.destroy();
  return { dataUrl, numPages, width: base.width, height: base.height };
}

export interface PdfParagraph {
  text: string;
  /** 1 or 2 for text clearly larger than the body text, else 0 */
  heading: 0 | 1 | 2;
}

/* Rebuild lines and paragraphs from pdf.js text items, page by page.
   Lines are grouped by baseline; a paragraph ends at a larger vertical gap
   or a change of font size. */
export async function extractParagraphsFromPDF(
  file: File,
  onProgress?: (p: number) => void
): Promise<PdfParagraph[][]> {
  const pdfjs = await getPdfjs();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: PdfParagraph[][] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    type Line = { y: number; x: number; size: number; parts: { x: number; str: string; w: number }[] };
    const lines: Line[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of content.items as any[]) {
      if (typeof item.str !== "string" || !item.transform) continue;
      if (!item.str && !item.hasEOL) continue;
      const [a, b, , , x, y] = item.transform as number[];
      const size = Math.hypot(a, b) || 10;
      let line = lines.find((l) => Math.abs(l.y - y) < size * 0.4);
      if (!line) {
        line = { y, x, size, parts: [] };
        lines.push(line);
      }
      line.size = Math.max(line.size, size);
      line.x = Math.min(line.x, x);
      if (item.str) line.parts.push({ x, str: item.str, w: item.width ?? 0 });
    }
    lines.sort((p, q) => q.y - p.y);

    const texts = lines
      .map((l) => {
        l.parts.sort((p, q) => p.x - q.x);
        let s = "";
        let end = -Infinity;
        for (const p of l.parts) {
          if (s && p.x - end > l.size * 0.15 && !s.endsWith(" ") && !p.str.startsWith(" ")) s += " ";
          s += p.str;
          end = p.x + p.w;
        }
        return { ...l, text: s.replace(/\s+/g, " ").trim() };
      })
      .filter((l) => l.text);

    /* Body size = most common line size */
    const counts = new Map<number, number>();
    for (const l of texts) {
      const k = Math.round(l.size);
      counts.set(k, (counts.get(k) ?? 0) + l.text.length);
    }
    const body = [...counts.entries()].sort((p, q) => q[1] - p[1])[0]?.[0] ?? 10;

    const paras: PdfParagraph[] = [];
    let cur: { text: string; size: number; lastY: number } | null = null;
    const close = () => {
      if (!cur) return;
      const ratio = cur.size / body;
      paras.push({ text: cur.text, heading: ratio >= 1.6 ? 1 : ratio >= 1.25 ? 2 : 0 });
      cur = null;
    };
    for (const l of texts) {
      const gap = cur ? cur.lastY - l.y : 0;
      const sameSize = cur && Math.abs(Math.round(l.size) - Math.round(cur.size)) <= 1;
      if (cur && sameSize && gap < l.size * 1.7) {
        cur.text = cur.text.endsWith("-") ? cur.text.slice(0, -1) + l.text : `${cur.text} ${l.text}`;
        cur.lastY = l.y;
      } else {
        close();
        cur = { text: l.text, size: l.size, lastY: l.y };
      }
    }
    close();
    pages.push(paras);
    onProgress?.(i / pdf.numPages);
  }
  await pdf.destroy();
  return pages;
}

export interface PageText {
  page: number;
  text: string;
  /** true when the text came from OCR because the page had no text layer */
  ocr: boolean;
}

/* Text of every page. Pages without a text layer (scans, photos) are rendered
   and read with Tesseract OCR in the browser. The OCR engine and English model
   are downloaded from a CDN the first time; the PDF itself is never uploaded. */
export async function extractTextWithOCR(
  file: File,
  opts: { ocr?: boolean; onStatus?: (msg: string, progress: number) => void } = {}
): Promise<PageText[]> {
  const { ocr = true, onStatus } = opts;
  const pdfjs = await getPdfjs();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const out: PageText[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let worker: any = null;
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      onStatus?.(`Reading page ${i} of ${pdf.numPages}`, (i - 1) / pdf.numPages);
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const lines: { y: number; parts: { x: number; s: string }[] }[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const it of content.items as any[]) {
        if (!it.str || !it.transform) continue;
        const y = it.transform[5];
        const size = Math.hypot(it.transform[0], it.transform[1]) || 10;
        let l = lines.find((q) => Math.abs(q.y - y) < size * 0.4);
        if (!l) lines.push((l = { y, parts: [] }));
        l.parts.push({ x: it.transform[4], s: it.str });
      }
      lines.sort((a, b) => b.y - a.y);
      const text = lines
        .map((l) => l.parts.sort((a, b) => a.x - b.x).map((p) => p.s).join(" ").replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join("\n");

      if (text.replace(/\s/g, "").length >= 10 || !ocr) {
        out.push({ page: i, text, ocr: false });
        continue;
      }

      if (!worker) {
        onStatus?.("Loading the OCR engine (first time only, about 15 MB)", (i - 1) / pdf.numPages);
        const { createWorker } = await import("tesseract.js");
        worker = await createWorker("eng");
      }
      onStatus?.(`Running OCR on page ${i} of ${pdf.numPages}`, (i - 0.5) / pdf.numPages);
      const { canvas, promise } = renderPage(page, 2);
      await promise;
      const { data } = await worker.recognize(canvas);
      canvas.width = canvas.height = 0;
      out.push({ page: i, text: (data.text || "").trim(), ocr: true });
    }
  } finally {
    if (worker) await worker.terminate();
    await pdf.destroy();
  }
  onStatus?.("Done", 1);
  return out;
}
