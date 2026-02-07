// ─── Core Types for PDF Editor Engine ───

/** Render scale used for high-DPI preview canvases */
export const RENDER_SCALE = 2;

/** Minimum font size auto-fit will shrink to (as ratio of original) */
export const AUTO_FIT_MIN_RATIO = 0.7;

/** Maximum letter-spacing adjustment in px */
export const AUTO_FIT_MAX_SPACING = 2;

// ─── Text Block ───

export interface TextBlock {
  id: string;
  pageIndex: number;

  // Original text
  text: string;

  // PDF coordinate space (bottom-left origin, in PDF user units)
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  pdfFontSize: number;

  // Screen coordinate space (top-left origin, in pixels at RENDER_SCALE)
  screenX: number;
  screenY: number;       // top of bounding box
  screenWidth: number;
  screenHeight: number;
  screenFontSize: number;
  screenBaseline: number; // y position of text baseline

  // Font info
  fontName: string;       // PDF internal font name
  fontFamily: string;     // Mapped web-safe font family
  fontWeight: string;     // "normal" | "bold"
  fontStyle: string;      // "normal" | "italic"

  // Color (hex)
  color: string;
  opacity: number;

  // Transform
  rotation: number;       // degrees
  scaleX: number;
  scaleY: number;

  // Sampled background color for redaction cover
  backgroundColor: string;

  // Edit state
  isEdited: boolean;
  editedText: string;

  // Auto-fit state
  adjustedFontSize: number;
  adjustedLetterSpacing: number;

  // Items that make up this block (for debugging / precision mode)
  itemCount: number;
}

// ─── Overlay Elements (non-text edits) ───

export interface AddedTextElement {
  type: "added-text";
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
}

export interface WhiteoutElement {
  type: "whiteout";
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface ImageElement {
  type: "image";
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
}

export interface DrawElement {
  type: "draw";
  id: string;
  pageIndex: number;
  points: { x: number; y: number }[];
  color: string;
  lineWidth: number;
}

export interface HighlightElement {
  type: "highlight";
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
}

export interface ShapeElement {
  type: "shape";
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  shapeType: "rectangle" | "ellipse" | "line";
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
}

export type OverlayElement =
  | AddedTextElement
  | WhiteoutElement
  | ImageElement
  | DrawElement
  | HighlightElement
  | ShapeElement;

// ─── Editor State ───

export type EditorTool =
  | "select"
  | "edit-text"
  | "add-text"
  | "highlight"
  | "draw"
  | "shape"
  | "whiteout"
  | "image"
  | "signature";

export interface PageData {
  pageIndex: number;
  width: number;         // canvas width at RENDER_SCALE
  height: number;        // canvas height at RENDER_SCALE
  pdfWidth: number;      // PDF page width in user units
  pdfHeight: number;     // PDF page height in user units
  imageDataUrl: string;  // rendered page image
  textBlocks: TextBlock[];
  isScanned: boolean;    // detected as scanned/image-only
  canvas: HTMLCanvasElement | null; // kept for color sampling
}

export interface EditorState {
  pages: PageData[];
  currentPage: number;
  zoom: number;
  activeTool: EditorTool;
  selectedBlockId: string | null;
  editingBlockId: string | null;
  selectedOverlayId: string | null;
  overlayElements: OverlayElement[];
  precisionMode: boolean;
  autoFitEnabled: boolean;
  showScannedWarning: boolean;
}

export interface UndoEntry {
  textBlockEdits: Map<string, { text: string; fontSize: number; letterSpacing: number }>;
  overlayElements: OverlayElement[];
}

// ─── Export Options ───

export type ExportMode = "standard" | "flattened";

export interface ExportOptions {
  mode: ExportMode;
  flattenDpi: number; // 300 default for flattened mode
}
