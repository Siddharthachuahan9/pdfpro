import {
  PDFDocument,
  PDFName,
  PDFRawStream,
  PDFArray,
  PDFDict,
  PDFNumber,
  PDFRef,
  PDFStream,
  decodePDFRawStream,
} from "pdf-lib";

export type CompressLevel = "light" | "recommended" | "strong";

export interface CompressResult {
  bytes: Uint8Array;
  originalSize: number;
  /** false when nothing we tried came out smaller, so the original is returned */
  reduced: boolean;
  imagesRecompressed: number;
  imagesFound: number;
  /** strong mode turns pages into pictures: text is no longer selectable */
  rasterized: boolean;
}

const SETTINGS: Record<CompressLevel, { quality: number; maxDim: number }> = {
  light: { quality: 0.82, maxDim: 2400 },
  recommended: { quality: 0.65, maxDim: 1600 },
  strong: { quality: 0.55, maxDim: 0 },
};

/* Strong mode renders each page at this resolution */
const STRONG_DPI = 110;

function name(v: unknown): string | undefined {
  return v instanceof PDFName ? v.asString() : undefined;
}

/* Number of colour components, or null for colour spaces we will not touch
   (CMYK, Indexed, Lab, DeviceN, Separation…). */
function componentsOf(doc: PDFDocument, cs: unknown): number | null {
  const resolved = cs instanceof PDFRef ? doc.context.lookup(cs) : cs;
  const n = name(resolved);
  if (n === "/DeviceRGB" || n === "/CalRGB") return 3;
  if (n === "/DeviceGray" || n === "/CalGray") return 1;
  if (resolved instanceof PDFArray && resolved.size() >= 2) {
    const kind = name(resolved.get(0));
    if (kind === "/CalRGB") return 3;
    if (kind === "/CalGray") return 1;
    if (kind === "/ICCBased") {
      const icc = doc.context.lookup(resolved.get(1));
      if (icc instanceof PDFStream) {
        const N = icc.dict.lookup(PDFName.of("N"));
        if (N instanceof PDFNumber && (N.asNumber() === 3 || N.asNumber() === 1)) {
          return N.asNumber();
        }
      }
    }
  }
  return null;
}

function filtersOf(dict: PDFDict): string[] {
  const f = dict.lookup(PDFName.of("Filter"));
  if (f instanceof PDFName) return [f.asString()];
  if (f instanceof PDFArray) return f.asArray().map((x) => name(x) ?? "?");
  return [];
}

/* Undo PNG row predictors (Predictor >= 10) */
function unpredictPNG(data: Uint8Array, columns: number, colors: number): Uint8Array {
  const bpp = colors; // 8 bits per component only
  const rowLen = columns * colors;
  const rows = Math.floor(data.length / (rowLen + 1));
  const out = new Uint8Array(rows * rowLen);
  for (let r = 0; r < rows; r++) {
    const type = data[r * (rowLen + 1)];
    const src = r * (rowLen + 1) + 1;
    const dst = r * rowLen;
    for (let i = 0; i < rowLen; i++) {
      const raw = data[src + i];
      const left = i >= bpp ? out[dst + i - bpp] : 0;
      const up = r > 0 ? out[dst - rowLen + i] : 0;
      const upLeft = r > 0 && i >= bpp ? out[dst - rowLen + i - bpp] : 0;
      let v: number;
      switch (type) {
        case 1: v = raw + left; break;
        case 2: v = raw + up; break;
        case 3: v = raw + ((left + up) >> 1); break;
        case 4: {
          const p = left + up - upLeft;
          const pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - upLeft);
          v = raw + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
          break;
        }
        default: v = raw;
      }
      out[dst + i] = v & 0xff;
    }
  }
  return out;
}

async function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
  if (!blob) throw new Error("JPEG encoding failed");
  return new Uint8Array(await blob.arrayBuffer());
}

/* Draw a source onto a white canvas no larger than maxDim on its long side */
function drawScaled(
  src: CanvasImageSource,
  w: number,
  h: number,
  maxDim: number
): HTMLCanvasElement {
  const scale = maxDim > 0 ? Math.min(1, maxDim / Math.max(w, h)) : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/* Re-encode one image XObject as a JPEG. Returns null if it should be left alone. */
async function recompressImage(
  doc: PDFDocument,
  stream: PDFRawStream,
  quality: number,
  maxDim: number
): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  const dict = stream.dict;
  const width = (dict.lookup(PDFName.of("Width")) as PDFNumber | undefined)?.asNumber();
  const height = (dict.lookup(PDFName.of("Height")) as PDFNumber | undefined)?.asNumber();
  if (!width || !height) return null;
  if (dict.lookup(PDFName.of("ImageMask"))) return null;
  if (dict.lookup(PDFName.of("Decode"))) return null;
  const comps = componentsOf(doc, dict.lookup(PDFName.of("ColorSpace")));
  if (comps === null) return null;
  const filters = filtersOf(dict);

  let canvas: HTMLCanvasElement;
  if (filters.length === 1 && filters[0] === "/DCTDecode") {
    const blob = new Blob([stream.contents as BlobPart], { type: "image/jpeg" });
    const bmp = await createImageBitmap(blob);
    canvas = drawScaled(bmp, bmp.width, bmp.height, maxDim);
    bmp.close();
  } else if (filters.length === 0 || (filters.length === 1 && filters[0] === "/FlateDecode")) {
    /* Flate-compressed or completely uncompressed pixel data */
    const bpc = (dict.lookup(PDFName.of("BitsPerComponent")) as PDFNumber | undefined)?.asNumber();
    if (bpc !== 8) return null;
    let raw = filters.length === 0 ? stream.contents : decodePDFRawStream(stream).decode();
    const parms = dict.lookup(PDFName.of("DecodeParms"));
    if (parms instanceof PDFDict) {
      const pred = (parms.lookup(PDFName.of("Predictor")) as PDFNumber | undefined)?.asNumber() ?? 1;
      if (pred >= 10) {
        const cols = (parms.lookup(PDFName.of("Columns")) as PDFNumber | undefined)?.asNumber() ?? width;
        const colors = (parms.lookup(PDFName.of("Colors")) as PDFNumber | undefined)?.asNumber() ?? comps;
        if (cols !== width || colors !== comps) return null;
        raw = unpredictPNG(raw, cols, colors);
      } else if (pred !== 1) {
        return null; // TIFF predictor: rare, skip
      }
    }
    if (raw.length < width * height * comps) return null;
    const rgba = new ImageData(width, height);
    const px = rgba.data;
    for (let i = 0, j = 0; i < width * height; i++, j += comps) {
      px[i * 4] = raw[j];
      px[i * 4 + 1] = comps === 3 ? raw[j + 1] : raw[j];
      px[i * 4 + 2] = comps === 3 ? raw[j + 2] : raw[j];
      px[i * 4 + 3] = 255;
    }
    const full = document.createElement("canvas");
    full.width = width;
    full.height = height;
    full.getContext("2d")!.putImageData(rgba, 0, 0);
    canvas = drawScaled(full, width, height, maxDim);
  } else {
    return null;
  }

  const bytes = await canvasToJpeg(canvas, quality);
  return { bytes, width: canvas.width, height: canvas.height };
}

/* Light / recommended: keep the PDF (text stays selectable), re-encode its images */
async function recompressImages(
  input: Uint8Array,
  level: Exclude<CompressLevel, "strong">,
  onProgress?: (p: number) => void
) {
  const { quality, maxDim } = SETTINGS[level];
  const doc = await PDFDocument.load(input, { updateMetadata: false });

  /* Images used as soft masks / masks of other images must stay as they are */
  const maskRefs = new Set<string>();
  const images: [PDFRef, PDFRawStream][] = [];
  for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    if (obj.dict.lookup(PDFName.of("Subtype")) !== PDFName.of("Image")) continue;
    images.push([ref, obj]);
    for (const key of ["SMask", "Mask"]) {
      const m = obj.dict.get(PDFName.of(key));
      if (m instanceof PDFRef) maskRefs.add(m.toString());
    }
  }

  let done = 0;
  let replaced = 0;
  for (const [ref, stream] of images) {
    done++;
    onProgress?.(done / images.length);
    if (maskRefs.has(ref.toString())) continue;
    if (stream.contents.length < 8 * 1024) continue; // not worth it
    try {
      const out = await recompressImage(doc, stream, quality, maxDim);
      /* unsupported format, or the JPEG would not be meaningfully smaller */
      if (!out || out.bytes.length >= stream.contents.length * 0.95) continue;
      const dict = stream.dict.clone(doc.context);
      dict.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
      dict.set(PDFName.of("ColorSpace"), PDFName.of("DeviceRGB"));
      dict.set(PDFName.of("BitsPerComponent"), PDFNumber.of(8));
      dict.set(PDFName.of("Width"), PDFNumber.of(out.width));
      dict.set(PDFName.of("Height"), PDFNumber.of(out.height));
      dict.delete(PDFName.of("DecodeParms"));
      dict.delete(PDFName.of("Length"));
      doc.context.assign(ref, PDFRawStream.of(dict, out.bytes));
      replaced++;
    } catch (err) {
      /* leave this image unchanged */
      console.warn("Image left unchanged:", err);
    }
  }

  const bytes = await doc.save({ useObjectStreams: true });
  return { bytes, imagesFound: images.length, imagesRecompressed: replaced };
}

/* Strong: render every page to a JPEG and rebuild the PDF from the pictures */
async function rasterize(input: Uint8Array, onProgress?: (p: number) => void) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).toString();
  const src = await pdfjs.getDocument({ data: input.slice() }).promise;
  const out = await PDFDocument.create();
  for (let i = 1; i <= src.numPages; i++) {
    const page = await src.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: STRONG_DPI / 72 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, canvas } as Parameters<typeof page.render>[0]).promise;
    const jpg = await out.embedJpg(await canvasToJpeg(canvas, SETTINGS.strong.quality));
    const p = out.addPage([base.width, base.height]);
    p.drawImage(jpg, { x: 0, y: 0, width: base.width, height: base.height });
    canvas.width = canvas.height = 0;
    onProgress?.(i / src.numPages);
  }
  await src.destroy();
  return out.save({ useObjectStreams: true });
}

export async function compressPDFFile(
  file: File,
  level: CompressLevel,
  onProgress?: (p: number) => void
): Promise<CompressResult> {
  const input = new Uint8Array(await file.arrayBuffer());
  let bytes: Uint8Array;
  let imagesFound = 0;
  let imagesRecompressed = 0;
  if (level === "strong") {
    bytes = await rasterize(input, onProgress);
  } else {
    const r = await recompressImages(input, level, onProgress);
    bytes = r.bytes;
    imagesFound = r.imagesFound;
    imagesRecompressed = r.imagesRecompressed;
  }
  /* Never hand back a bigger file */
  if (bytes.length >= input.length) {
    return {
      bytes: input,
      originalSize: input.length,
      reduced: false,
      imagesFound,
      imagesRecompressed,
      rasterized: false,
    };
  }
  return {
    bytes,
    originalSize: input.length,
    reduced: true,
    imagesFound,
    imagesRecompressed,
    rasterized: level === "strong",
  };
}
