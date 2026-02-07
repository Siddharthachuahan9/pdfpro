// ─── PDF Editor Core Engine ───
// Text extraction, block merging, hit testing, font mapping, color sampling

import { TextBlock, PageData, RENDER_SCALE } from "./types";

// ─── Font Mapping ───

const PDF_TO_WEB_FONT: Record<string, { family: string; weight: string; style: string }> = {
  // Helvetica family
  "Helvetica":              { family: "Helvetica, Arial, sans-serif", weight: "normal", style: "normal" },
  "Helvetica-Bold":         { family: "Helvetica, Arial, sans-serif", weight: "bold",   style: "normal" },
  "Helvetica-Oblique":      { family: "Helvetica, Arial, sans-serif", weight: "normal", style: "italic" },
  "Helvetica-BoldOblique":  { family: "Helvetica, Arial, sans-serif", weight: "bold",   style: "italic" },
  // Arial family
  "ArialMT":                { family: "Arial, Helvetica, sans-serif", weight: "normal", style: "normal" },
  "Arial-BoldMT":           { family: "Arial, Helvetica, sans-serif", weight: "bold",   style: "normal" },
  "Arial-ItalicMT":         { family: "Arial, Helvetica, sans-serif", weight: "normal", style: "italic" },
  "Arial-BoldItalicMT":     { family: "Arial, Helvetica, sans-serif", weight: "bold",   style: "italic" },
  // Times family
  "TimesNewRomanPSMT":      { family: "Times New Roman, Times, serif", weight: "normal", style: "normal" },
  "TimesNewRomanPS-BoldMT": { family: "Times New Roman, Times, serif", weight: "bold",   style: "normal" },
  "TimesNewRomanPS-ItalicMT":     { family: "Times New Roman, Times, serif", weight: "normal", style: "italic" },
  "TimesNewRomanPS-BoldItalicMT": { family: "Times New Roman, Times, serif", weight: "bold",   style: "italic" },
  "Times-Roman":            { family: "Times New Roman, Times, serif", weight: "normal", style: "normal" },
  "Times-Bold":             { family: "Times New Roman, Times, serif", weight: "bold",   style: "normal" },
  "Times-Italic":           { family: "Times New Roman, Times, serif", weight: "normal", style: "italic" },
  "Times-BoldItalic":       { family: "Times New Roman, Times, serif", weight: "bold",   style: "italic" },
  // Courier family
  "CourierNewPSMT":         { family: "Courier New, Courier, monospace", weight: "normal", style: "normal" },
  "CourierNewPS-BoldMT":    { family: "Courier New, Courier, monospace", weight: "bold",   style: "normal" },
  "Courier":                { family: "Courier New, Courier, monospace", weight: "normal", style: "normal" },
  "Courier-Bold":           { family: "Courier New, Courier, monospace", weight: "bold",   style: "normal" },
  "Courier-Oblique":        { family: "Courier New, Courier, monospace", weight: "normal", style: "italic" },
  "Courier-BoldOblique":    { family: "Courier New, Courier, monospace", weight: "bold",   style: "italic" },
  // Calibri
  "Calibri":                { family: "Calibri, Helvetica, Arial, sans-serif", weight: "normal", style: "normal" },
  "Calibri-Bold":           { family: "Calibri, Helvetica, Arial, sans-serif", weight: "bold",   style: "normal" },
  "Calibri-Italic":         { family: "Calibri, Helvetica, Arial, sans-serif", weight: "normal", style: "italic" },
  // Garamond
  "Garamond":               { family: "Garamond, Georgia, serif", weight: "normal", style: "normal" },
  "Garamond-Bold":          { family: "Garamond, Georgia, serif", weight: "bold",   style: "normal" },
  // Georgia
  "Georgia":                { family: "Georgia, serif", weight: "normal", style: "normal" },
  "Georgia-Bold":           { family: "Georgia, serif", weight: "bold",   style: "normal" },
  // Verdana
  "Verdana":                { family: "Verdana, Geneva, sans-serif", weight: "normal", style: "normal" },
  "Verdana-Bold":           { family: "Verdana, Geneva, sans-serif", weight: "bold",   style: "normal" },
  // Tahoma
  "Tahoma":                 { family: "Tahoma, Verdana, sans-serif", weight: "normal", style: "normal" },
  "Tahoma-Bold":            { family: "Tahoma, Verdana, sans-serif", weight: "bold",   style: "normal" },
};

function mapFont(
  pdfFontName: string,
  pdfFontFamily: string
): { family: string; weight: string; style: string } {
  // Direct match
  if (PDF_TO_WEB_FONT[pdfFontName]) {
    return PDF_TO_WEB_FONT[pdfFontName];
  }

  // Try matching by font family from styles
  const familyLower = pdfFontFamily.toLowerCase();

  // Detect weight/style from name
  const isBold =
    familyLower.includes("bold") ||
    pdfFontName.toLowerCase().includes("bold");
  const isItalic =
    familyLower.includes("italic") ||
    familyLower.includes("oblique") ||
    pdfFontName.toLowerCase().includes("italic") ||
    pdfFontName.toLowerCase().includes("oblique");
  const weight = isBold ? "bold" : "normal";
  const style = isItalic ? "italic" : "normal";

  // Try to match by family name patterns
  if (familyLower.includes("helvetica") || familyLower.includes("arial")) {
    return { family: "Helvetica, Arial, sans-serif", weight, style };
  }
  if (familyLower.includes("times") || familyLower.includes("roman")) {
    return { family: "Times New Roman, Times, serif", weight, style };
  }
  if (familyLower.includes("courier") || familyLower.includes("mono")) {
    return { family: "Courier New, Courier, monospace", weight, style };
  }
  if (familyLower.includes("calibri")) {
    return { family: "Calibri, Helvetica, Arial, sans-serif", weight, style };
  }
  if (familyLower.includes("georgia")) {
    return { family: "Georgia, serif", weight, style };
  }
  if (familyLower.includes("verdana")) {
    return { family: "Verdana, Geneva, sans-serif", weight, style };
  }
  if (familyLower.includes("tahoma")) {
    return { family: "Tahoma, Verdana, sans-serif", weight, style };
  }

  // Use the PDF font family directly with fallbacks
  const cleanFamily = pdfFontFamily
    .replace(/[-_](Bold|Italic|Oblique|Regular|Medium|Light|Thin|Black|Heavy|Condensed|Narrow)/gi, "")
    .trim();

  if (cleanFamily) {
    // Detect serif vs sans-serif from common patterns
    if (familyLower.includes("serif") && !familyLower.includes("sans")) {
      return { family: `${cleanFamily}, Georgia, serif`, weight, style };
    }
    return { family: `${cleanFamily}, Helvetica, Arial, sans-serif`, weight, style };
  }

  // Ultimate fallback
  return { family: "Helvetica, Arial, sans-serif", weight, style };
}

// ─── Color Sampling ───

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

function sampleCanvasColor(
  canvas: HTMLCanvasElement,
  x: number,
  y: number
): string {
  const ctx = canvas.getContext("2d");
  if (!ctx) return "#000000";
  const cx = Math.max(0, Math.min(Math.round(x), canvas.width - 1));
  const cy = Math.max(0, Math.min(Math.round(y), canvas.height - 1));
  const pixel = ctx.getImageData(cx, cy, 1, 1).data;
  return rgbToHex(pixel[0], pixel[1], pixel[2]);
}

/** Sample text color from the center of a text block */
export function sampleTextColor(
  canvas: HTMLCanvasElement,
  block: { screenX: number; screenBaseline: number; screenWidth: number; screenFontSize: number }
): string {
  // Sample at center of text baseline area
  const x = block.screenX + block.screenWidth * 0.3;
  const y = block.screenBaseline - block.screenFontSize * 0.3;
  return sampleCanvasColor(canvas, x, y);
}

/** Sample background color around a text block */
export function sampleBackgroundColor(
  canvas: HTMLCanvasElement,
  block: { screenX: number; screenY: number; screenWidth: number; screenHeight: number }
): string {
  // Sample multiple points around the block edges and take the most common
  const samples: string[] = [];
  const offsets = [
    { x: block.screenX - 2, y: block.screenY + block.screenHeight / 2 },
    { x: block.screenX + block.screenWidth + 2, y: block.screenY + block.screenHeight / 2 },
    { x: block.screenX + block.screenWidth / 2, y: block.screenY - 2 },
    { x: block.screenX + block.screenWidth / 2, y: block.screenY + block.screenHeight + 2 },
    { x: block.screenX - 3, y: block.screenY - 3 },
    { x: block.screenX + block.screenWidth + 3, y: block.screenY - 3 },
  ];

  for (const offset of offsets) {
    samples.push(sampleCanvasColor(canvas, offset.x, offset.y));
  }

  // Return most common color
  const counts = new Map<string, number>();
  for (const s of samples) {
    counts.set(s, (counts.get(s) || 0) + 1);
  }
  let maxColor = samples[0];
  let maxCount = 0;
  for (const [color, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxColor = color;
    }
  }
  return maxColor;
}

// ─── Text Extraction ───

interface PdfJsTextItem {
  str: string;
  dir: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
  hasEOL: boolean;
}

interface PdfJsTextStyle {
  fontFamily: string;
  ascent: number;
  descent: number;
  vertical: boolean;
}

/**
 * Extract text blocks from a single PDF page.
 * Returns blocks in screen coordinate space (at RENDER_SCALE).
 */
export async function extractTextBlocks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  pageIndex: number,
  canvas: HTMLCanvasElement
): Promise<TextBlock[]> {
  const viewport = page.getViewport({ scale: RENDER_SCALE });
  const textContent = await page.getTextContent();
  const items: PdfJsTextItem[] = textContent.items.filter(
    (item: PdfJsTextItem) => item.str && item.str.trim().length > 0
  );
  const styles: Record<string, PdfJsTextStyle> = textContent.styles;

  if (items.length === 0) return [];

  // Convert each text item to a raw block
  const rawBlocks: TextBlock[] = items.map((item, idx) => {
    const [a, b, c, d, tx, ty] = item.transform;

    // Font size from transform matrix
    const pdfFontSize = Math.sqrt(a * a + b * b);
    const rotation = Math.atan2(b, a) * (180 / Math.PI);
    const scaleX = Math.sqrt(a * a + b * b);
    const scaleY = Math.sqrt(c * c + d * d);

    // PDF coordinates
    const pdfX = tx;
    const pdfY = ty;
    const pdfWidth = item.width;
    const pdfHeight = item.height || pdfFontSize;

    // Convert to screen coordinates using viewport
    const [screenX, screenBaselineY] = viewport.convertToViewportPoint(pdfX, pdfY);
    const screenFontSize = pdfFontSize * RENDER_SCALE;
    const screenWidth = pdfWidth * RENDER_SCALE;

    // Screen Y is baseline, top is baseline - ascent
    const style = styles[item.fontName];
    const ascent = style?.ascent || 0.8;
    const screenY = screenBaselineY - screenFontSize * ascent;

    // Font mapping
    const fontInfo = mapFont(item.fontName, style?.fontFamily || "");

    // Sample colors
    const textColor = sampleTextColor(canvas, {
      screenX,
      screenBaseline: screenBaselineY,
      screenWidth,
      screenFontSize,
    });
    const bgColor = sampleBackgroundColor(canvas, {
      screenX,
      screenY,
      screenWidth,
      screenHeight: screenFontSize * (ascent + Math.abs(style?.descent || 0.2)),
    });

    return {
      id: `tb-${pageIndex}-${idx}`,
      pageIndex,
      text: item.str,
      pdfX,
      pdfY,
      pdfWidth,
      pdfHeight,
      pdfFontSize,
      screenX,
      screenY,
      screenWidth,
      screenHeight: screenFontSize * (ascent + Math.abs(style?.descent || 0.2)),
      screenFontSize,
      screenBaseline: screenBaselineY,
      fontName: item.fontName,
      fontFamily: fontInfo.family,
      fontWeight: fontInfo.weight,
      fontStyle: fontInfo.style,
      color: textColor,
      opacity: 1,
      rotation,
      scaleX,
      scaleY,
      backgroundColor: bgColor,
      isEdited: false,
      editedText: item.str,
      adjustedFontSize: screenFontSize,
      adjustedLetterSpacing: 0,
      itemCount: 1,
    };
  });

  // Merge adjacent blocks into text groups
  return mergeAdjacentBlocks(rawBlocks);
}

// ─── Block Merging ───

function mergeAdjacentBlocks(blocks: TextBlock[]): TextBlock[] {
  if (blocks.length === 0) return [];

  const sorted = [...blocks].sort((a, b) => {
    // Sort by baseline Y (top to bottom), then by X (left to right)
    const yDiff = a.screenBaseline - b.screenBaseline;
    if (Math.abs(yDiff) > 3) return yDiff;
    return a.screenX - b.screenX;
  });

  const merged: TextBlock[] = [];
  let current = { ...sorted[0] };
  let currentItemCount = 1;

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    const canMerge = shouldMerge(current, next);

    if (canMerge) {
      // Merge next into current
      const newRight = Math.max(
        current.screenX + current.screenWidth,
        next.screenX + next.screenWidth
      );
      const gap = next.screenX - (current.screenX + current.screenWidth);
      const separator = gap > current.screenFontSize * 0.3 ? " " : "";

      current = {
        ...current,
        text: current.text + separator + next.text,
        editedText: current.text + separator + next.text,
        screenWidth: newRight - current.screenX,
        pdfWidth: current.pdfWidth + next.pdfWidth + (separator ? current.pdfFontSize * 0.3 : 0),
        itemCount: currentItemCount + 1,
      };
      currentItemCount++;
    } else {
      current.itemCount = currentItemCount;
      merged.push(current);
      current = { ...next };
      currentItemCount = 1;
    }
  }
  current.itemCount = currentItemCount;
  merged.push(current);

  // Assign stable IDs
  return merged.map((block, idx) => ({
    ...block,
    id: `tb-${block.pageIndex}-${idx}`,
  }));
}

function shouldMerge(a: TextBlock, b: TextBlock): boolean {
  // Must be on same page
  if (a.pageIndex !== b.pageIndex) return false;

  // Similar baseline (within 4px tolerance)
  if (Math.abs(a.screenBaseline - b.screenBaseline) > 4) return false;

  // Same font
  if (a.fontName !== b.fontName) return false;

  // Similar font size (within 15%)
  const sizeRatio = a.screenFontSize / b.screenFontSize;
  if (sizeRatio < 0.85 || sizeRatio > 1.15) return false;

  // Small horizontal gap (less than 2x font size)
  const gap = b.screenX - (a.screenX + a.screenWidth);
  if (gap < -2 || gap > a.screenFontSize * 2) return false;

  // Similar rotation
  if (Math.abs(a.rotation - b.rotation) > 1) return false;

  return true;
}

// ─── Scanned PDF Detection ───

export function detectScannedPage(textBlocks: TextBlock[], pageWidth: number, pageHeight: number): boolean {
  if (textBlocks.length === 0) return true;

  // If very few text blocks for a full page, likely scanned
  const pageArea = pageWidth * pageHeight;
  const textArea = textBlocks.reduce(
    (sum, b) => sum + b.screenWidth * b.screenHeight,
    0
  );
  const textCoverage = textArea / pageArea;

  // If text covers less than 0.5% of page, likely scanned
  if (textCoverage < 0.005) return true;

  // If fewer than 3 text blocks on a standard-sized page, likely scanned
  if (textBlocks.length < 3 && pageArea > 200000) return true;

  return false;
}

// ─── Hit Testing ───

export function hitTestTextBlock(
  blocks: TextBlock[],
  x: number,
  y: number
): TextBlock | null {
  // Test in reverse order (top elements first)
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    if (
      x >= block.screenX - 2 &&
      x <= block.screenX + block.screenWidth + 2 &&
      y >= block.screenY - 2 &&
      y <= block.screenY + block.screenHeight + 2
    ) {
      return block;
    }
  }
  return null;
}

// ─── Auto-fit ───

/**
 * Calculate adjusted font size and letter spacing to fit text within original bounding box.
 * Returns adjusted values without mutating the block.
 */
export function calculateAutoFit(
  originalWidth: number,
  originalFontSize: number,
  newText: string,
  originalText: string
): { fontSize: number; letterSpacing: number } {
  if (!newText || newText.length === 0) {
    return { fontSize: originalFontSize, letterSpacing: 0 };
  }

  // Estimate width ratio based on character count (rough heuristic)
  // In a real implementation, we'd measure with canvas
  const ratio = newText.length / Math.max(originalText.length, 1);

  if (ratio <= 1) {
    // New text is shorter or same - no adjustment needed
    return { fontSize: originalFontSize, letterSpacing: 0 };
  }

  // First try: adjust letter spacing (compress up to -1px)
  if (ratio <= 1.15) {
    const spacingAdjust = -((ratio - 1) * originalFontSize * 0.5);
    return { fontSize: originalFontSize, letterSpacing: Math.max(spacingAdjust, -1) };
  }

  // Second try: reduce font size (down to 70% of original)
  const neededScale = 1 / ratio;
  const minScale = 0.7;
  const scale = Math.max(neededScale, minScale);
  const adjustedSize = originalFontSize * scale;

  // May also need letter spacing if scale hit minimum
  let spacing = 0;
  if (neededScale < minScale) {
    const remainingRatio = (ratio * minScale);
    spacing = -Math.min((remainingRatio - 1) * adjustedSize * 0.3, 1.5);
  }

  return { fontSize: adjustedSize, letterSpacing: spacing };
}

/**
 * Measure text width using a temporary canvas.
 */
export function measureTextWidth(
  text: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: string,
  fontStyle: string,
  letterSpacing: number
): number {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return text.length * fontSize * 0.6;

  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  return metrics.width + letterSpacing * (text.length - 1);
}

/**
 * Precise auto-fit using canvas measurement.
 */
export function preciseAutoFit(
  block: TextBlock,
  newText: string
): { fontSize: number; letterSpacing: number; fits: boolean } {
  const targetWidth = block.screenWidth;
  const originalFontSize = block.screenFontSize;

  // Measure new text at original size
  const currentWidth = measureTextWidth(
    newText,
    block.fontFamily,
    originalFontSize,
    block.fontWeight,
    block.fontStyle,
    0
  );

  if (currentWidth <= targetWidth + 2) {
    return { fontSize: originalFontSize, letterSpacing: 0, fits: true };
  }

  // Try letter spacing first (up to -1.5px)
  for (let spacing = -0.1; spacing >= -1.5; spacing -= 0.1) {
    const w = measureTextWidth(newText, block.fontFamily, originalFontSize, block.fontWeight, block.fontStyle, spacing);
    if (w <= targetWidth + 2) {
      return { fontSize: originalFontSize, letterSpacing: Math.round(spacing * 10) / 10, fits: true };
    }
  }

  // Try reducing font size (down to 70%)
  for (let sizeRatio = 0.95; sizeRatio >= 0.7; sizeRatio -= 0.05) {
    const size = originalFontSize * sizeRatio;
    const w = measureTextWidth(newText, block.fontFamily, size, block.fontWeight, block.fontStyle, 0);
    if (w <= targetWidth + 2) {
      return { fontSize: Math.round(size * 10) / 10, letterSpacing: 0, fits: true };
    }
  }

  // Try both reduced size and letter spacing
  const minSize = originalFontSize * 0.7;
  for (let spacing = -0.1; spacing >= -1.5; spacing -= 0.1) {
    const w = measureTextWidth(newText, block.fontFamily, minSize, block.fontWeight, block.fontStyle, spacing);
    if (w <= targetWidth + 2) {
      return { fontSize: Math.round(minSize * 10) / 10, letterSpacing: Math.round(spacing * 10) / 10, fits: true };
    }
  }

  // Doesn't fit - return best effort
  return { fontSize: Math.round(minSize * 10) / 10, letterSpacing: -1.5, fits: false };
}

// ─── Page Rendering ───

export async function renderPageToCanvas(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  scale: number = RENDER_SCALE
): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;

  await (page.render({
    canvasContext: ctx,
    viewport,
    canvas,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)).promise;

  return canvas;
}

// ─── Full Page Processing ───

export async function processPage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  pageIndex: number,
  scale: number = RENDER_SCALE
): Promise<PageData> {
  // Render page to canvas
  const canvas = await renderPageToCanvas(page, scale);
  const imageDataUrl = canvas.toDataURL("image/png");

  // Extract text blocks
  const viewport = page.getViewport({ scale });
  const textBlocks = await extractTextBlocks(page, pageIndex, canvas);

  // Detect scanned page
  const isScanned = detectScannedPage(textBlocks, viewport.width, viewport.height);

  // Get page dimensions
  const baseViewport = page.getViewport({ scale: 1 });

  return {
    pageIndex,
    width: viewport.width,
    height: viewport.height,
    pdfWidth: baseViewport.width,
    pdfHeight: baseViewport.height,
    imageDataUrl,
    textBlocks,
    isScanned,
    canvas,
  };
}

// ─── State Persistence ───

const STORAGE_KEY = "pdfpro-editor-state";

export function saveEditorState(
  editedBlocks: Map<string, { text: string; fontSize: number; letterSpacing: number }>,
  overlayElements: OverlayElement[],
  fileName: string
): void {
  try {
    const data = {
      fileName,
      timestamp: Date.now(),
      editedBlocks: Array.from(editedBlocks.entries()),
      overlayElements,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable - silently fail
  }
}

export function loadEditorState(fileName: string): {
  editedBlocks: Map<string, { text: string; fontSize: number; letterSpacing: number }>;
  overlayElements: OverlayElement[];
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.fileName !== fileName) return null;
    // Only restore if less than 24 hours old
    if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) return null;
    return {
      editedBlocks: new Map(data.editedBlocks),
      overlayElements: data.overlayElements || [],
    };
  } catch {
    return null;
  }
}

export function clearEditorState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

// Re-export types needed by components
import type { OverlayElement } from "./types";
