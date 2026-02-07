// ─── PDF Export Engine ───
// Applies text edits and overlay elements back into the PDF structure

import {
  OverlayElement,
  PageData,
  RENDER_SCALE,
  ExportMode,
} from "./types";

/**
 * Export edited PDF using redaction-style replacement.
 * For each edited text block:
 *   1. Draw a background rectangle over the original text
 *   2. Draw the new text on top with matched style
 */
export async function exportEditedPDF(
  originalPdfBytes: ArrayBuffer,
  pages: PageData[],
  overlayElements: OverlayElement[],
  mode: ExportMode = "standard",
  onProgress?: (pct: number) => void
): Promise<Uint8Array> {
  const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.load(originalPdfBytes);

  // Embed standard fonts for replacement text
  const fonts = {
    helvetica: await pdfDoc.embedFont(StandardFonts.Helvetica),
    helveticaBold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    helveticaItalic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    helveticaBoldItalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
    times: await pdfDoc.embedFont(StandardFonts.TimesRoman),
    timesBold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
    timesItalic: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
    timesBoldItalic: await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic),
    courier: await pdfDoc.embedFont(StandardFonts.Courier),
    courierBold: await pdfDoc.embedFont(StandardFonts.CourierBold),
    courierItalic: await pdfDoc.embedFont(StandardFonts.CourierOblique),
    courierBoldItalic: await pdfDoc.embedFont(StandardFonts.CourierBoldOblique),
  };

  onProgress?.(10);

  const pdfPages = pdfDoc.getPages();
  const scale = RENDER_SCALE;
  const totalPages = pdfPages.length;

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const pdfPage = pdfPages[pageIdx];
    const { height: pdfHeight } = pdfPage.getSize();
    const pageData = pages[pageIdx];

    if (!pageData) continue;

    // ─── Apply text block edits ───
    for (const block of pageData.textBlocks) {
      if (!block.isEdited || block.editedText === block.text) continue;

      // 1. Draw background rectangle to cover original text
      const bgColor = hexToRgb(block.backgroundColor);
      const padding = 1; // small padding in PDF units

      pdfPage.drawRectangle({
        x: block.pdfX - padding,
        y: block.pdfY - block.pdfFontSize * 0.3 - padding,
        width: block.pdfWidth + padding * 2,
        height: block.pdfFontSize * 1.3 + padding * 2,
        color: rgb(bgColor.r, bgColor.g, bgColor.b),
        borderWidth: 0,
      });

      // 2. Draw replacement text
      const font = selectFont(fonts, block.fontFamily, block.fontWeight, block.fontStyle);
      const textColor = hexToRgb(block.color);
      const exportFontSize = block.adjustedFontSize / scale;

      // Handle letter spacing by drawing characters individually if needed
      if (Math.abs(block.adjustedLetterSpacing) > 0.01) {
        drawTextWithSpacing(
          pdfPage,
          block.editedText,
          block.pdfX,
          block.pdfY,
          exportFontSize,
          font,
          rgb(textColor.r, textColor.g, textColor.b),
          block.adjustedLetterSpacing / scale
        );
      } else {
        pdfPage.drawText(block.editedText, {
          x: block.pdfX,
          y: block.pdfY,
          size: exportFontSize,
          font,
          color: rgb(textColor.r, textColor.g, textColor.b),
        });
      }
    }

    // ─── Apply overlay elements ───
    const pageOverlays = overlayElements.filter((el) => el.pageIndex === pageIdx);

    for (const el of pageOverlays) {
      switch (el.type) {
        case "whiteout": {
          const c = hexToRgb(el.color);
          pdfPage.drawRectangle({
            x: el.x / scale,
            y: pdfHeight - (el.y + el.height) / scale,
            width: el.width / scale,
            height: el.height / scale,
            color: rgb(c.r, c.g, c.b),
            borderWidth: 0,
          });
          break;
        }

        case "highlight": {
          const c = hexToRgb(el.color);
          pdfPage.drawRectangle({
            x: el.x / scale,
            y: pdfHeight - (el.y + el.height) / scale,
            width: el.width / scale,
            height: el.height / scale,
            color: rgb(c.r, c.g, c.b),
            opacity: el.opacity,
            borderWidth: 0,
          });
          break;
        }

        case "added-text": {
          const c = hexToRgb(el.color);
          const font = el.bold
            ? el.italic
              ? fonts.helveticaBoldItalic
              : fonts.helveticaBold
            : el.italic
            ? fonts.helveticaItalic
            : fonts.helvetica;

          pdfPage.drawText(el.text, {
            x: el.x / scale,
            y: pdfHeight - el.y / scale,
            size: el.fontSize / scale,
            font,
            color: rgb(c.r, c.g, c.b),
          });
          break;
        }

        case "draw": {
          const c = hexToRgb(el.color);
          for (let i = 0; i < el.points.length - 1; i++) {
            const p1 = el.points[i];
            const p2 = el.points[i + 1];
            pdfPage.drawLine({
              start: { x: p1.x / scale, y: pdfHeight - p1.y / scale },
              end: { x: p2.x / scale, y: pdfHeight - p2.y / scale },
              thickness: el.lineWidth / scale,
              color: rgb(c.r, c.g, c.b),
            });
          }
          break;
        }

        case "shape": {
          const sc = hexToRgb(el.strokeColor);
          const fc = hexToRgb(el.fillColor);
          if (el.shapeType === "rectangle") {
            pdfPage.drawRectangle({
              x: el.x / scale,
              y: pdfHeight - (el.y + el.height) / scale,
              width: el.width / scale,
              height: el.height / scale,
              borderColor: rgb(sc.r, sc.g, sc.b),
              borderWidth: el.strokeWidth / scale,
              color: el.fillColor === "transparent" ? undefined : rgb(fc.r, fc.g, fc.b),
              opacity: el.fillColor === "transparent" ? 0 : 0.3,
            });
          } else if (el.shapeType === "ellipse") {
            pdfPage.drawEllipse({
              x: (el.x + el.width / 2) / scale,
              y: pdfHeight - (el.y + el.height / 2) / scale,
              xScale: (el.width / 2) / scale,
              yScale: (el.height / 2) / scale,
              borderColor: rgb(sc.r, sc.g, sc.b),
              borderWidth: el.strokeWidth / scale,
              color: el.fillColor === "transparent" ? undefined : rgb(fc.r, fc.g, fc.b),
              opacity: el.fillColor === "transparent" ? 0 : 0.3,
            });
          } else if (el.shapeType === "line") {
            pdfPage.drawLine({
              start: { x: el.x / scale, y: pdfHeight - el.y / scale },
              end: {
                x: (el.x + el.width) / scale,
                y: pdfHeight - (el.y + el.height) / scale,
              },
              thickness: el.strokeWidth / scale,
              color: rgb(sc.r, sc.g, sc.b),
            });
          }
          break;
        }

        case "image": {
          try {
            const resp = await fetch(el.dataUrl);
            const imgBytes = await resp.arrayBuffer();
            let embeddedImg;
            if (el.dataUrl.includes("image/png")) {
              embeddedImg = await pdfDoc.embedPng(imgBytes);
            } else {
              embeddedImg = await pdfDoc.embedJpg(imgBytes);
            }
            pdfPage.drawImage(embeddedImg, {
              x: el.x / scale,
              y: pdfHeight - (el.y + el.height) / scale,
              width: el.width / scale,
              height: el.height / scale,
            });
          } catch {
            // Skip failed image embeds
          }
          break;
        }
      }
    }

    onProgress?.(10 + Math.round(((pageIdx + 1) / totalPages) * 80));
  }

  // For flattened mode, rasterize edited regions
  if (mode === "flattened") {
    // For now, standard save. Full flattening would require
    // re-rendering each page with edits and embedding as images.
    // This is a future enhancement.
  }

  const result = await pdfDoc.save();
  onProgress?.(100);
  return result;
}

/**
 * Validate exported PDF by checking page count and basic structure.
 */
export async function validateExport(
  exportedBytes: Uint8Array,
  expectedPageCount: number
): Promise<{ valid: boolean; error?: string }> {
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.mjs",
      import.meta.url
    ).toString();

    const doc = await pdfjs.getDocument({ data: exportedBytes }).promise;
    if (doc.numPages !== expectedPageCount) {
      return {
        valid: false,
        error: `Page count mismatch: expected ${expectedPageCount}, got ${doc.numPages}`,
      };
    }
    // Try rendering first page as basic validation
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 0.5 });
    if (viewport.width <= 0 || viewport.height <= 0) {
      return { valid: false, error: "Invalid page dimensions in export" };
    }
    return { valid: true };
  } catch (err) {
    return { valid: false, error: String(err) };
  }
}

// ─── Helpers ───

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  if (hex === "transparent") return { r: 1, g: 1, b: 1 };
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function selectFont(fonts: any, fontFamily: string, fontWeight: string, fontStyle: string): any {
  const isBold = fontWeight === "bold";
  const isItalic = fontStyle === "italic";
  const familyLower = fontFamily.toLowerCase();

  if (familyLower.includes("times") || familyLower.includes("roman") || familyLower.includes("serif")) {
    if (!familyLower.includes("sans")) {
      if (isBold && isItalic) return fonts.timesBoldItalic;
      if (isBold) return fonts.timesBold;
      if (isItalic) return fonts.timesItalic;
      return fonts.times;
    }
  }

  if (familyLower.includes("courier") || familyLower.includes("mono")) {
    if (isBold && isItalic) return fonts.courierBoldItalic;
    if (isBold) return fonts.courierBold;
    if (isItalic) return fonts.courierItalic;
    return fonts.courier;
  }

  // Default: Helvetica family
  if (isBold && isItalic) return fonts.helveticaBoldItalic;
  if (isBold) return fonts.helveticaBold;
  if (isItalic) return fonts.helveticaItalic;
  return fonts.helvetica;
}

function drawTextWithSpacing(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  text: string,
  x: number,
  y: number,
  size: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  font: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  color: any,
  letterSpacing: number
): void {
  let currentX = x;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    page.drawText(char, {
      x: currentX,
      y,
      size,
      font,
      color,
    });
    const charWidth = font.widthOfTextAtSize(char, size);
    currentX += charWidth + letterSpacing;
  }
}
