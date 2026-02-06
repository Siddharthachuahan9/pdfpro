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
    } as any).promise,
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
      .map((item: any) => item.str)
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
