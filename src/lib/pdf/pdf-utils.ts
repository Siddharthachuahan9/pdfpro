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

  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const margin = 36;

  for (const page of pages) {
    const { x: bx, y: by, width, height } = page.getCropBox();
    /* Shrink the text if, once rotated, it would not fit on the page */
    let size = fontSize;
    const extents = (sz: number) => {
      const tw = font.widthOfTextAtSize(text, sz);
      const th = font.heightAtSize(sz, { descender: false });
      return {
        tw,
        th,
        ex: (Math.abs(cos) * tw + Math.abs(sin) * th) / 2,
        ey: (Math.abs(sin) * tw + Math.abs(cos) * th) / 2,
      };
    };
    let e = extents(size);
    const fit = Math.min(
      (width - 2 * margin) / (2 * e.ex),
      (height - 2 * margin) / (2 * e.ey),
      1
    );
    if (fit < 1) {
      size = Math.max(6, size * fit);
      e = extents(size);
    }

    /* Centre of the rotated text box for the chosen position */
    let cx: number;
    let cy: number;
    switch (position) {
      case "top-left":
        cx = bx + margin + e.ex;
        cy = by + height - margin - e.ey;
        break;
      case "top-right":
        cx = bx + width - margin - e.ex;
        cy = by + height - margin - e.ey;
        break;
      case "bottom-left":
        cx = bx + margin + e.ex;
        cy = by + margin + e.ey;
        break;
      case "bottom-right":
        cx = bx + width - margin - e.ex;
        cy = by + margin + e.ey;
        break;
      default:
        cx = bx + width / 2;
        cy = by + height / 2;
    }

    /* drawText rotates around the baseline start, so offset it so the
       rotation happens around the middle of the text */
    const hx = e.tw / 2;
    const hy = e.th / 2;
    const x = cx - (hx * cos - hy * sin);
    const y = cy - (hx * sin + hy * cos);

    page.drawText(text, {
      x,
      y,
      size,
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

/* Place a signature image. Position is given as fractions of the visible page
   (centre of the signature, measured from the top-left) and its width as a
   fraction of the page width, so it matches what the user saw in the preview. */
export async function addSignature(
  file: File,
  signatureDataUrl: string,
  pageIndex: number,
  placement: { cx: number; cy: number; widthFrac: number; aspect: number }
): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);

  const signatureBytes = await fetch(signatureDataUrl).then((r) =>
    r.arrayBuffer()
  );
  const signatureImage = await pdf.embedPng(signatureBytes);

  const page = pdf.getPages()[pageIndex];
  if (!page) throw new Error(`Page ${pageIndex + 1} does not exist`);
  const box = page.getCropBox();
  const rot = ((page.getRotation().angle % 360) + 360) % 360;
  /* Visible (rotated) page size, as the preview shows it */
  const visW = rot === 90 || rot === 270 ? box.height : box.width;
  const visH = rot === 90 || rot === 270 ? box.width : box.height;
  const w = placement.widthFrac * visW;
  const h = w / placement.aspect;
  /* Bottom-left corner of the signature in visible-page coordinates (y up) */
  const vx = placement.cx * visW - w / 2;
  const vy = visH - placement.cy * visH - h / 2;
  /* Map visible coordinates back to unrotated user space */
  let x: number, y: number;
  switch (rot) {
    case 90: x = box.x + box.width - vy; y = box.y + vx; break;
    case 180: x = box.x + box.width - vx; y = box.y + box.height - vy; break;
    case 270: x = box.x + vy; y = box.y + box.height - vx; break;
    default: x = box.x + vx; y = box.y + vy;
  }
  page.drawImage(signatureImage, { x, y, width: w, height: h, rotate: degrees(rot) });

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

export type ImagePageSize = "a4" | "letter" | "original";

/* Read the EXIF orientation tag from a JPEG (1 = upright) */
function jpegOrientation(b: Uint8Array): number {
  let i = 2;
  while (i + 4 < b.length) {
    if (b[i] !== 0xff) return 1;
    const marker = b[i + 1];
    const len = (b[i + 2] << 8) | b[i + 3];
    if (marker === 0xe1 && b[i + 4] === 0x45 && b[i + 5] === 0x78) {
      const t = i + 10; // TIFF header
      const le = b[t] === 0x49;
      const u16 = (o: number) => (le ? b[o] | (b[o + 1] << 8) : (b[o] << 8) | b[o + 1]);
      const u32 = (o: number) => (le ? u16(o) | (u16(o + 2) << 16) : (u16(o) << 16) | u16(o + 2));
      const ifd = t + u32(t + 4);
      const n = u16(ifd);
      for (let k = 0; k < n; k++) {
        const e = ifd + 2 + k * 12;
        if (u16(e) === 0x0112) return u16(e + 8);
      }
      return 1;
    }
    if (marker === 0xda) return 1;
    i += 2 + len;
  }
  return 1;
}

/* Re-encode through a canvas: applies EXIF rotation, converts other formats */
async function reencode(bytes: Uint8Array, type: "image/jpeg" | "image/png"): Promise<Uint8Array> {
  const bmp = await createImageBitmap(new Blob([bytes as BlobPart]), { imageOrientation: "from-image" });
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0);
  bmp.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.92));
  if (!blob) throw new Error("Could not encode image");
  return new Uint8Array(await blob.arrayBuffer());
}

export async function imagesToPDF(
  files: File[],
  options: { pageSize?: ImagePageSize; margin?: number } = {}
): Promise<Uint8Array> {
  const { pageSize = "a4", margin = 0 } = options;
  const pdf = await PDFDocument.create();

  for (const file of files) {
    let bytes: Uint8Array = new Uint8Array(await file.arrayBuffer());

    /* Decide by the file's bytes, not its name or MIME type */
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    let image;
    if (isPng) {
      image = await pdf.embedPng(bytes);
    } else if (isJpg) {
      if (jpegOrientation(bytes) > 1) bytes = await reencode(bytes, "image/jpeg");
      image = await pdf.embedJpg(bytes);
    } else {
      /* WebP, GIF, BMP… : let the browser decode it */
      image = await pdf.embedPng(await reencode(bytes, "image/png"));
    }

    /* "original": 1 image pixel = 1 point (72 dpi). Otherwise fit inside A4/Letter,
       turning the page to landscape for wide images. */
    let pw: number, ph: number;
    if (pageSize === "original") {
      pw = image.width + margin * 2;
      ph = image.height + margin * 2;
    } else {
      const [a, b] = pageSize === "letter" ? PageSizes.Letter : PageSizes.A4;
      const landscape = image.width > image.height;
      pw = landscape ? b : a;
      ph = landscape ? a : b;
    }
    const page = pdf.addPage([pw, ph]);
    const scale = Math.min((pw - margin * 2) / image.width, (ph - margin * 2) / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    page.drawImage(image, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
  }

  return pdf.save();
}
