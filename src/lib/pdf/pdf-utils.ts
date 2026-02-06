import { PDFDocument, rgb, StandardFonts, degrees, PageSizes } from "pdf-lib";

export async function mergePDFs(files: File[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  return merged.save();
}

export async function splitPDF(
  file: File,
  ranges: { start: number; end: number }[]
): Promise<Uint8Array[]> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const results: Uint8Array[] = [];

  for (const range of ranges) {
    const newPdf = await PDFDocument.create();
    const indices = [];
    for (let i = range.start; i <= range.end && i < pdf.getPageCount(); i++) {
      indices.push(i);
    }
    const pages = await newPdf.copyPages(pdf, indices);
    pages.forEach((page) => newPdf.addPage(page));
    results.push(await newPdf.save());
  }

  return results;
}

export async function compressPDF(file: File): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);

  // Re-save with optimization - pdf-lib strips unused objects
  const compressed = await PDFDocument.create();
  const pages = await compressed.copyPages(pdf, pdf.getPageIndices());
  pages.forEach((page) => compressed.addPage(page));

  return compressed.save();
}

export async function rotatePDF(
  file: File,
  angle: number,
  pageIndices?: number[]
): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const pages = pdf.getPages();
  const targetPages = pageIndices || pages.map((_, i) => i);

  for (const idx of targetPages) {
    if (idx < pages.length) {
      const current = pages[idx].getRotation().angle;
      pages[idx].setRotation(degrees(current + angle));
    }
  }

  return pdf.save();
}

export async function deletePages(
  file: File,
  pagesToDelete: number[]
): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const newPdf = await PDFDocument.create();

  const keepIndices = pdf
    .getPageIndices()
    .filter((i) => !pagesToDelete.includes(i));

  const pages = await newPdf.copyPages(pdf, keepIndices);
  pages.forEach((page) => newPdf.addPage(page));

  return newPdf.save();
}

export async function reorderPages(
  file: File,
  newOrder: number[]
): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const newPdf = await PDFDocument.create();

  const pages = await newPdf.copyPages(pdf, newOrder);
  pages.forEach((page) => newPdf.addPage(page));

  return newPdf.save();
}

export async function addWatermark(
  file: File,
  text: string,
  options: {
    fontSize?: number;
    opacity?: number;
    rotation?: number;
    position?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  } = {}
): Promise<Uint8Array> {
  const {
    fontSize = 48,
    opacity = 0.3,
    rotation = -45,
    position = "center",
  } = options;

  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = fontSize;

    let x: number;
    let y: number;

    switch (position) {
      case "top-left":
        x = 50;
        y = height - 50 - textHeight;
        break;
      case "top-right":
        x = width - textWidth - 50;
        y = height - 50 - textHeight;
        break;
      case "bottom-left":
        x = 50;
        y = 50;
        break;
      case "bottom-right":
        x = width - textWidth - 50;
        y = 50;
        break;
      default:
        x = (width - textWidth) / 2;
        y = (height - textHeight) / 2;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity,
      rotate: degrees(rotation),
    });
  }

  return pdf.save();
}

export async function addPageNumbers(
  file: File,
  options: {
    position?: "bottom-center" | "bottom-left" | "bottom-right" | "top-center" | "top-left" | "top-right";
    fontSize?: number;
    startFrom?: number;
  } = {}
): Promise<Uint8Array> {
  const {
    position = "bottom-center",
    fontSize = 12,
    startFrom = 1,
  } = options;

  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();

  pages.forEach((page, idx) => {
    const { width, height } = page.getSize();
    const text = String(idx + startFrom);
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    let x: number;
    let y: number;

    const margin = 40;

    switch (position) {
      case "bottom-left":
        x = margin;
        y = margin;
        break;
      case "bottom-right":
        x = width - textWidth - margin;
        y = margin;
        break;
      case "top-center":
        x = (width - textWidth) / 2;
        y = height - margin;
        break;
      case "top-left":
        x = margin;
        y = height - margin;
        break;
      case "top-right":
        x = width - textWidth - margin;
        y = height - margin;
        break;
      default:
        x = (width - textWidth) / 2;
        y = margin;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  });

  return pdf.save();
}

export async function addSignature(
  file: File,
  signatureDataUrl: string,
  pageIndex: number,
  position: { x: number; y: number; width: number; height: number }
): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);

  const signatureBytes = await fetch(signatureDataUrl).then((r) =>
    r.arrayBuffer()
  );
  const signatureImage = await pdf.embedPng(signatureBytes);

  const page = pdf.getPages()[pageIndex];
  if (page) {
    page.drawImage(signatureImage, {
      x: position.x,
      y: position.y,
      width: position.width,
      height: position.height,
    });
  }

  return pdf.save();
}

export async function protectPDF(
  file: File
): Promise<Uint8Array> {
  // pdf-lib does not natively support encryption
  // For basic "protection" we re-save as-is
  // In production you'd use a WASM-based PDF library
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  return pdf.save();
}

export async function cropPDF(
  file: File,
  cropBox: { left: number; bottom: number; right: number; top: number }
): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const pages = pdf.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    page.setCropBox(
      cropBox.left,
      cropBox.bottom,
      width - cropBox.left - cropBox.right,
      height - cropBox.bottom - cropBox.top
    );
  }

  return pdf.save();
}

export async function getPDFPageCount(file: File): Promise<number> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  return pdf.getPageCount();
}

export async function imagesToPDF(files: File[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const uint8 = new Uint8Array(bytes);

    let image;
    if (file.type === "image/png") {
      image = await pdf.embedPng(uint8);
    } else {
      image = await pdf.embedJpg(uint8);
    }

    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  return pdf.save();
}
