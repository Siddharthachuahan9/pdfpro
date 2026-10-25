import type { PdfParagraph } from "@/lib/pdf/pdf-render";

/* Build an editable .docx from paragraphs extracted per page. Text only:
   layout, fonts, tables and images from the PDF are not carried over. */
export async function paragraphsToDocx(pages: PdfParagraph[][]): Promise<Blob> {
  const { Document, Packer, Paragraph, HeadingLevel, PageBreak, TextRun } = await import("docx");
  const children: InstanceType<typeof Paragraph>[] = [];
  pages.forEach((paras, idx) => {
    if (idx > 0) children.push(new Paragraph({ children: [new PageBreak()] }));
    for (const p of paras) {
      children.push(
        p.heading
          ? new Paragraph({ text: p.text, heading: p.heading === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2 })
          : new Paragraph({ children: [new TextRun(p.text)], spacing: { after: 120 } })
      );
    }
  });
  if (children.length === 0) children.push(new Paragraph({ text: "" }));
  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{ children }],
  });
  return Packer.toBlob(doc);
}

export function paragraphsToText(pages: PdfParagraph[][]): string {
  return pages
    .map((paras, i) => `--- Page ${i + 1} ---\n${paras.map((p) => p.text).join("\n\n")}`)
    .join("\n\n");
}
