import { tools } from "@/lib/tools-data";

/**
 * The site's own plain-language index of the 20 tools, grouped the way people look for them.
 * Names and routes come from src/lib/tools-data.ts, so a link can never point at a page that
 * does not exist; only the short line under each name lives here.
 */
const blurbs: Record<string, string> = {
  merge: "Join several PDFs into one file",
  split: "Cut a PDF into separate files",
  "delete-pages": "Remove the pages you do not need",
  "reorder-pages": "Put the pages in a new order",
  rotate: "Turn pages that came out sideways",
  "crop-pdf": "Trim the margins off every page",
  "add-page-numbers": "Number every page where you choose",
  "pdf-to-jpg": "Save each page as a JPG image",
  "jpg-to-pdf": "Turn JPG photos into one PDF",
  "png-to-pdf": "Turn PNG images into one PDF",
  "word-to-pdf": "Convert a .docx document into a PDF",
  "pdf-to-word": "Copy a PDF's text into a Word file",
  "extract-text": "Copy all the text out of a PDF",
  "edit-pdf": "Add text, whiteout, highlights and images",
  "sign-pdf": "Draw your signature and place it",
  watermark: "Stamp a line of text across pages",
  "protect-pdf": "Add a password to a PDF",
  "unlock-pdf": "Remove a password you know",
  compress: "Re-save a PDF, sometimes a little smaller",
  "chat-with-pdf": "Search a PDF's text by keyword",
};

const groupIds: { name: string; ids: string[] }[] = [
  { name: "Organise", ids: ["merge", "split", "delete-pages", "reorder-pages", "rotate", "crop-pdf", "add-page-numbers"] },
  { name: "Convert", ids: ["pdf-to-jpg", "jpg-to-pdf", "png-to-pdf", "word-to-pdf", "pdf-to-word", "extract-text"] },
  { name: "Edit and sign", ids: ["edit-pdf", "sign-pdf", "watermark"] },
  { name: "Secure", ids: ["protect-pdf", "unlock-pdf"] },
  { name: "Other", ids: ["compress", "chat-with-pdf"] },
];

export interface ToolEntry {
  id: string;
  name: string;
  href: string;
  blurb: string;
  group: string;
}

const byId = new Map(tools.map((t) => [t.id, t]));

export const toolGroups: { name: string; tools: ToolEntry[] }[] = groupIds.map((g) => ({
  name: g.name,
  tools: g.ids
    .filter((id) => byId.has(id))
    .map((id) => {
      const t = byId.get(id)!;
      return { id, name: t.name, href: t.href, blurb: blurbs[id] ?? t.description, group: g.name };
    }),
}));

/** Every tool in tools-data, in group order; any tool not placed in a group lands in "Other". */
export const allTools: ToolEntry[] = (() => {
  const placed = toolGroups.flatMap((g) => g.tools);
  const seen = new Set(placed.map((t) => t.id));
  const rest = tools
    .filter((t) => !seen.has(t.id))
    .map((t) => ({ id: t.id, name: t.name, href: t.href, blurb: blurbs[t.id] ?? t.description, group: "Other" }));
  return [...placed, ...rest];
})();

export const toolCount = allTools.length;

export function toolByHref(href: string): ToolEntry | undefined {
  return allTools.find((t) => t.href === href);
}
