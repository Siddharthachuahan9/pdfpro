"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Pencil,
  Download,
  Type,
  Square,
  ImagePlus,
  Undo2,
  Redo2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Trash2,
  MousePointer,
  Bold,
  Italic,
  Underline,
  Highlighter,
  Strikethrough,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { downloadPDF } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ToolSEOContent } from "@/components/seo/tool-seo-content";

/* ═══════════════════════════════════════════════
   TYPE DEFINITIONS FOR ALL EDITOR ELEMENTS
   ═══════════════════════════════════════════════ */

type EditTool = "select" | "text" | "whiteout" | "image" | "draw" | "sign" | "highlight";

interface TextElement {
  type: "text";
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  page: number;
}

interface WhiteoutElement {
  type: "whiteout";
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  page: number;
}

interface ImageElement {
  type: "image";
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
  page: number;
}

interface DrawElement {
  type: "draw";
  id: string;
  points: { x: number; y: number }[];
  color: string;
  lineWidth: number;
  page: number;
}

/* Highlight, underline, or strikethrough annotation drawn over PDF content */
interface HighlightElement {
  type: "highlight";
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: "highlight" | "underline" | "strikethrough";
  color: string;
  page: number;
}

/* Signature placed on the page (stored as a data-URL image) */
interface SignatureElement {
  type: "signature";
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
  page: number;
}

type EditElement =
  | TextElement
  | WhiteoutElement
  | ImageElement
  | DrawElement
  | HighlightElement
  | SignatureElement;

/* ═══════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════ */

const FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
];

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

const MIN_WIDTH = 40;
const MIN_HEIGHT = 20;

/* ═══════════════════════════════════════════════
   SIGNATURE PAD COMPONENT
   A modal with a <canvas> for drawing signatures
   ═══════════════════════════════════════════════ */

function SignaturePadModal({
  onInsert,
  onClose,
}: {
  onInsert: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  /* Get position relative to the signature canvas */
  const getPos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    /* The canvas is drawn at 460x200 but displayed at CSS width, so scale */
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * sx,
        y: (touch.clientY - rect.top) * sy,
      };
    }
    return {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top) * sy,
    };
  };

  const startDraw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const endDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasDrawn(false);
  };

  const handleInsert = () => {
    if (!canvasRef.current || !hasDrawn) return;

    /* Trim the signature to its bounding box so it doesn't have excessive whitespace */
    const ctx = canvasRef.current.getContext("2d")!;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    const imageData = ctx.getImageData(0, 0, w, h);
    const { data } = imageData;

    let minX = w,
      minY = h,
      maxX = 0,
      maxY = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const alpha = data[(y * w + x) * 4 + 3];
        if (alpha > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (maxX <= minX || maxY <= minY) return;

    const pad = 10;
    const cropX = Math.max(0, minX - pad);
    const cropY = Math.max(0, minY - pad);
    const cropW = Math.min(w, maxX - minX + pad * 2);
    const cropH = Math.min(h, maxY - minY + pad * 2);

    const trimmed = document.createElement("canvas");
    trimmed.width = cropW;
    trimmed.height = cropH;
    const tCtx = trimmed.getContext("2d")!;
    tCtx.drawImage(canvasRef.current, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    onInsert(trimmed.toDataURL("image/png"));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Draw Your Signature</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawing canvas */}
        <div className="border-2 border-dashed border-border rounded-xl overflow-hidden bg-white mb-4">
          <canvas
            ref={canvasRef}
            width={460}
            height={200}
            className="w-full cursor-crosshair touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>

        <p className="text-xs text-muted-foreground mb-4 text-center">
          Draw your signature above using mouse or touch
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={clearCanvas}>
            Clear
          </Button>
          <Button
            size="sm"
            className="gradient-primary"
            onClick={handleInsert}
            disabled={!hasDrawn}
          >
            Insert Signature
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN EDITOR COMPONENT
   ═══════════════════════════════════════════════ */

export default function EditPDFPage() {
  /* ── File & PDF state ── */
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  /* Size of every page in PDF points (pdf.js viewport at scale 1).
     All overlay coordinates are stored in this space: 1 unit = 1 PDF point,
     origin top-left of the visible page. */
  const [pageSizes, setPageSizes] = useState<{ w: number; h: number }[]>([]);
  const pageSize = pageSizes[currentPage] ?? null;
  /* pdf.js viewports (scale 1) used to convert overlay points to PDF user space */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewportsRef = useRef<any[]>([]);
  /* Width available for the page in the scroll area (CSS px) */
  const [availWidth, setAvailWidth] = useState(0);

  /* ── Tool state ── */
  const [activeTool, setActiveTool] = useState<EditTool>("text");

  /* ── Element management ── */
  const [elements, setElements] = useState<EditElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<EditElement[][]>([]);
  const [redoStack, setRedoStack] = useState<EditElement[][]>([]);

  /* ── Default text formatting ── */
  const [defaultFontFamily] = useState("Arial");
  const [defaultFontSize] = useState(16);
  const [defaultTextColor] = useState("#000000");
  const [defaultBold] = useState(false);
  const [defaultItalic] = useState(false);
  const [defaultUnderline] = useState(false);

  /* ── Whiteout / Draw defaults ── */
  const [whiteoutColor, setWhiteoutColor] = useState("#ffffff");
  const [drawColor, setDrawColor] = useState("#000000");
  const [drawWidth, setDrawWidth] = useState(2);

  /* ── Highlight defaults ── */
  const [highlightStyle, setHighlightStyle] = useState<
    "highlight" | "underline" | "strikethrough"
  >("highlight");
  const [highlightColor, setHighlightColor] = useState("#FFFF00");

  /* ── Signature modal ── */
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  /* ── Interaction state ── */
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDraw, setCurrentDraw] = useState<{ x: number; y: number }[] | null>(null);
  const [dragState, setDragState] = useState<{
    elementId: string;
    offsetX: number;
    offsetY: number;
    type: "move" | "resize";
    handle?: string;
    startWidth?: number;
    startHeight?: number;
    startX?: number;
    startY?: number;
  } | null>(null);

  /* ── Refs ── */
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textInputRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  /* ═══════════════════════════════════════════════
     UNDO / REDO
     ═══════════════════════════════════════════════ */

  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-30), [...elements]]);
    setRedoStack([]);
  }, [elements]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, [...elements]]);
    setElements(prev);
    setUndoStack((u) => u.slice(0, -1));
    setSelectedElement(null);
    setEditingText(null);
  }, [undoStack, elements]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, [...elements]]);
    setElements(next);
    setRedoStack((r) => r.slice(0, -1));
    setSelectedElement(null);
    setEditingText(null);
  }, [redoStack, elements]);

  /* ═══════════════════════════════════════════════
     LOAD PDF — render all pages as images
     ═══════════════════════════════════════════════ */

  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    setFiles(newFiles);
    setElements([]);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedElement(null);
    setEditingText(null);
    setCurrentPage(0);
    setPageImages([]);

    if (newFiles.length > 0) {
      setProcessing(true);
      setProgress(10);

      try {
        const bytes = new Uint8Array(await newFiles[0].arrayBuffer());
        /* Keep our own copy: pdf.js transfers (detaches) the buffer it is given */
        setPdfBytes(bytes);
        setProgress(20);

        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.mjs",
          import.meta.url
        ).toString();

        const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
        const images: string[] = [];
        const sizes: { w: number; h: number }[] = [];
        viewportsRef.current = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const baseViewport = page.getViewport({ scale: 1 });
          viewportsRef.current.push(baseViewport);
          sizes.push({ w: baseViewport.width, h: baseViewport.height });
          /* Render at 2x for a crisp preview; displayed at 1 CSS px per point */
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;

          await page.render({
            canvasContext: ctx,
            viewport,
            canvas,
          } as Parameters<typeof page.render>[0]).promise;

          images.push(canvas.toDataURL("image/png"));
          setProgress(20 + Math.round((i / pdf.numPages) * 70));
        }

        setPageSizes(sizes);
        setPageImages(images);
        setProgress(100);
      } catch (err) {
        console.error("Failed to load PDF:", err);
        alert("Failed to load PDF. Please try a different file.");
      } finally {
        setProcessing(false);
      }
    }
  }, []);

  /* ═══════════════════════════════════════════════
     COORDINATE HELPERS
     ═══════════════════════════════════════════════ */

  /* Fit the page to the available width (phones), then apply user zoom.
     Overlay coordinates are in PDF points; the on-screen size is points * displayScale. */
  const fitScale =
    pageSize && availWidth > 0 ? Math.min(1.5, availWidth / pageSize.w) : 1;
  const displayScale = fitScale * zoom;

  const getRelativePos = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left) / displayScale,
      y: (e.clientY - rect.top) / displayScale,
    };
  };

  /* ═══════════════════════════════════════════════
     HIT TESTING
     ═══════════════════════════════════════════════ */

  const isPointInElement = (pos: { x: number; y: number }, el: EditElement): boolean => {
    if (el.type === "draw") {
      for (const pt of el.points) {
        if (Math.sqrt((pos.x - pt.x) ** 2 + (pos.y - pt.y) ** 2) < 10) return true;
      }
      return false;
    }
    // All box-based elements
    const ex = el.x;
    const ey = el.y;
    const ew = "width" in el ? el.width : 0;
    const eh = "height" in el ? el.height : 0;
    return pos.x >= ex && pos.x <= ex + ew && pos.y >= ey && pos.y <= ey + eh;
  };

  /* ═══════════════════════════════════════════════
     RESIZE HANDLE DETECTION
     ═══════════════════════════════════════════════ */

  const getResizeHandle = (
    pos: { x: number; y: number },
    el: EditElement
  ): string | null => {
    if (el.type === "draw") return null;
    if (!("width" in el)) return null;
    const handleSize = 8;
    const handles = [
      { name: "nw", cx: el.x, cy: el.y },
      { name: "ne", cx: el.x + el.width, cy: el.y },
      { name: "sw", cx: el.x, cy: el.y + el.height },
      { name: "se", cx: el.x + el.width, cy: el.y + el.height },
    ];
    for (const h of handles) {
      if (Math.abs(pos.x - h.cx) <= handleSize && Math.abs(pos.y - h.cy) <= handleSize) {
        return h.name;
      }
    }
    return null;
  };

  /* ═══════════════════════════════════════════════
     COMMIT TEXT BOX — sync contenteditable → state
     ═══════════════════════════════════════════════ */

  const commitTextBox = useCallback((elementId: string) => {
    const div = textInputRefs.current.get(elementId);
    if (!div) {
      setEditingText(null);
      return;
    }
    const text = div.innerText || "";
    setElements((prev) =>
      prev
        .map((el) =>
          el.id === elementId && el.type === "text" ? { ...el, text } : el
        )
        .filter((el) =>
          el.type === "text" && el.id === elementId && text.trim() === "" ? false : true
        )
    );
    setEditingText(null);
  }, []);

  /* ═══════════════════════════════════════════════
     MOUSE HANDLERS
     ═══════════════════════════════════════════════ */

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-text-editor]")) return;

    const pos = getRelativePos(e);

    /* ── SELECT ── */
    if (activeTool === "select") {
      const pageElements = elements.filter((el) => el.page === currentPage);

      // Check resize handles on selected element first
      if (selectedElement) {
        const selEl = pageElements.find((el) => el.id === selectedElement);
        if (selEl) {
          const handle = getResizeHandle(pos, selEl);
          if (handle && "width" in selEl) {
            setDragState({
              elementId: selEl.id,
              offsetX: pos.x,
              offsetY: pos.y,
              type: "resize",
              handle,
              startWidth: selEl.width,
              startHeight: selEl.height,
              startX: selEl.x,
              startY: selEl.y,
            });
            return;
          }
        }
      }

      // Check if clicking on an element
      for (let i = pageElements.length - 1; i >= 0; i--) {
        const el = pageElements[i];
        if (isPointInElement(pos, el)) {
          setSelectedElement(el.id);
          if (el.type === "draw") {
            const minX = Math.min(...el.points.map((p) => p.x));
            const minY = Math.min(...el.points.map((p) => p.y));
            setDragState({
              elementId: el.id,
              offsetX: pos.x - minX,
              offsetY: pos.y - minY,
              type: "move",
            });
          } else {
            setDragState({
              elementId: el.id,
              offsetX: pos.x - el.x,
              offsetY: pos.y - el.y,
              type: "move",
            });
          }
          if (editingText && editingText !== el.id) commitTextBox(editingText);
          return;
        }
      }

      // Empty space — deselect
      if (editingText) commitTextBox(editingText);
      setSelectedElement(null);
      setEditingText(null);
      return;
    }

    /* ── TEXT ── */
    if (activeTool === "text") {
      if (editingText) commitTextBox(editingText);
      pushUndo();
      const newEl: TextElement = {
        type: "text",
        id: `text-${Date.now()}`,
        x: pos.x,
        y: pos.y,
        width: 200,
        height: defaultFontSize * 1.5,
        text: "",
        fontSize: defaultFontSize,
        fontFamily: defaultFontFamily,
        color: defaultTextColor,
        bold: defaultBold,
        italic: defaultItalic,
        underline: defaultUnderline,
        page: currentPage,
      };
      setElements((prev) => [...prev, newEl]);
      setSelectedElement(newEl.id);
      setEditingText(newEl.id);
      return;
    }

    /* ── WHITEOUT ── */
    if (activeTool === "whiteout") {
      if (editingText) commitTextBox(editingText);
      setIsDrawing(true);
      setDrawStart(pos);
      return;
    }

    /* ── HIGHLIGHT ── */
    if (activeTool === "highlight") {
      if (editingText) commitTextBox(editingText);
      setIsDrawing(true);
      setDrawStart(pos);
      return;
    }

    /* ── DRAW ── */
    if (activeTool === "draw") {
      if (editingText) commitTextBox(editingText);
      setIsDrawing(true);
      setCurrentDraw([pos]);
      return;
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const pos = getRelativePos(e);

    /* Drag / resize */
    if (dragState) {
      if (dragState.type === "move") {
        setElements((prev) =>
          prev.map((el) => {
            if (el.id !== dragState.elementId) return el;
            if (el.type === "draw") {
              const minX = Math.min(...el.points.map((p) => p.x));
              const minY = Math.min(...el.points.map((p) => p.y));
              const dx = pos.x - dragState.offsetX - minX;
              const dy = pos.y - dragState.offsetY - minY;
              return { ...el, points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
            }
            return { ...el, x: pos.x - dragState.offsetX, y: pos.y - dragState.offsetY };
          })
        );
        return;
      }

      if (dragState.type === "resize" && dragState.handle) {
        const dx = pos.x - dragState.offsetX;
        const dy = pos.y - dragState.offsetY;
        const sw = dragState.startWidth || 0;
        const sh = dragState.startHeight || 0;
        const sx = dragState.startX || 0;
        const sy = dragState.startY || 0;

        setElements((prev) =>
          prev.map((el) => {
            if (el.id !== dragState.elementId || el.type === "draw") return el;
            if (!("width" in el)) return el;
            let newX = el.x, newY = el.y, newW = el.width, newH = el.height;
            switch (dragState.handle) {
              case "se": newW = Math.max(MIN_WIDTH, sw + dx); newH = Math.max(MIN_HEIGHT, sh + dy); break;
              case "sw": newW = Math.max(MIN_WIDTH, sw - dx); newH = Math.max(MIN_HEIGHT, sh + dy); newX = sx + (sw - newW); break;
              case "ne": newW = Math.max(MIN_WIDTH, sw + dx); newH = Math.max(MIN_HEIGHT, sh - dy); newY = sy + (sh - newH); break;
              case "nw": newW = Math.max(MIN_WIDTH, sw - dx); newH = Math.max(MIN_HEIGHT, sh - dy); newX = sx + (sw - newW); newY = sy + (sh - newH); break;
            }
            return { ...el, x: newX, y: newY, width: newW, height: newH };
          })
        );
        return;
      }
    }

    /* Whiteout / highlight preview */
    if ((activeTool === "whiteout" || activeTool === "highlight") && isDrawing && drawStart) {
      setCurrentDraw([drawStart, pos]);
      return;
    }

    /* Freehand draw */
    if (activeTool === "draw" && isDrawing && currentDraw) {
      setCurrentDraw((prev) => [...(prev || []), pos]);
      return;
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const pos = getRelativePos(e);

    if (dragState) {
      pushUndo();
      setDragState(null);
      return;
    }

    /* End whiteout draw */
    if (activeTool === "whiteout" && isDrawing && drawStart) {
      const x = Math.min(drawStart.x, pos.x);
      const y = Math.min(drawStart.y, pos.y);
      const w = Math.abs(pos.x - drawStart.x);
      const h = Math.abs(pos.y - drawStart.y);
      if (w > 5 && h > 5) {
        pushUndo();
        setElements((prev) => [
          ...prev,
          {
            type: "whiteout",
            id: `whiteout-${Date.now()}`,
            x, y, width: w, height: h,
            color: whiteoutColor,
            page: currentPage,
          },
        ]);
      }
      setIsDrawing(false);
      setDrawStart(null);
      setCurrentDraw(null);
      return;
    }

    /* End highlight/underline/strikethrough draw */
    if (activeTool === "highlight" && isDrawing && drawStart) {
      const x = Math.min(drawStart.x, pos.x);
      const y = Math.min(drawStart.y, pos.y);
      const w = Math.abs(pos.x - drawStart.x);
      const h = Math.abs(pos.y - drawStart.y);
      if (w > 5 && h > 3) {
        pushUndo();
        setElements((prev) => [
          ...prev,
          {
            type: "highlight",
            id: `hl-${Date.now()}`,
            x, y, width: w, height: h,
            style: highlightStyle,
            color: highlightColor,
            page: currentPage,
          },
        ]);
      }
      setIsDrawing(false);
      setDrawStart(null);
      setCurrentDraw(null);
      return;
    }

    /* End freehand draw */
    if (activeTool === "draw" && isDrawing && currentDraw && currentDraw.length > 1) {
      pushUndo();
      setElements((prev) => [
        ...prev,
        {
          type: "draw",
          id: `draw-${Date.now()}`,
          points: currentDraw,
          color: drawColor,
          lineWidth: drawWidth,
          page: currentPage,
        },
      ]);
      setIsDrawing(false);
      setCurrentDraw(null);
      return;
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentDraw(null);
    setDragState(null);
  };

  /* Double-click to edit existing text */
  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== "select") return;
    if ((e.target as HTMLElement).closest("[data-text-editor]")) return;
    const pos = getRelativePos(e);
    const pageEls = elements.filter((el) => el.page === currentPage);
    for (let i = pageEls.length - 1; i >= 0; i--) {
      const el = pageEls[i];
      if (el.type === "text" && isPointInElement(pos, el)) {
        setSelectedElement(el.id);
        setEditingText(el.id);
        return;
      }
    }
  };

  /* ═══════════════════════════════════════════════
     DELETE SELECTED ELEMENT
     ═══════════════════════════════════════════════ */

  const deleteSelected = useCallback(() => {
    if (!selectedElement) return;
    pushUndo();
    setElements((prev) => prev.filter((el) => el.id !== selectedElement));
    setSelectedElement(null);
    setEditingText(null);
  }, [selectedElement, pushUndo]);

  /* ═══════════════════════════════════════════════
     IMAGE UPLOAD
     ═══════════════════════════════════════════════ */

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      pushUndo();
      const img = new window.Image();
      img.onload = () => {
        /* Scale down large images to fit page */
        const maxDim = pageSize ? Math.min(pageSize.w * 0.5, 400) : 300;
        const ratio = img.width / img.height;
        let w = Math.min(img.width, maxDim);
        let h = w / ratio;
        if (h > maxDim) {
          h = maxDim;
          w = h * ratio;
        }
        /* Center on the visible page */
        const cx = pageSize ? (pageSize.w - w) / 2 : 50;
        const cy = pageSize ? (pageSize.h - h) / 2 : 50;
        /* pdf-lib embeds only PNG and JPEG: convert anything else (WebP, GIF…) to PNG */
        let dataUrl = reader.result as string;
        if (!/^data:image\/(png|jpe?g);/i.test(dataUrl)) {
          const c = document.createElement("canvas");
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          c.getContext("2d")!.drawImage(img, 0, 0);
          dataUrl = c.toDataURL("image/png");
        }
        const id = `img-${Date.now()}`;
        setElements((prev) => [
          ...prev,
          {
            type: "image",
            id,
            x: cx,
            y: cy,
            width: w,
            height: h,
            dataUrl,
            page: currentPage,
          },
        ]);
        setSelectedElement(id);
        setActiveTool("select");
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  /* ═══════════════════════════════════════════════
     SIGNATURE INSERTION
     ═══════════════════════════════════════════════ */

  const handleSignatureInsert = (dataUrl: string) => {
    pushUndo();
    const img = new window.Image();
    img.onload = () => {
      const maxW = 200;
      const ratio = img.width / img.height;
      const w = Math.min(img.width, maxW);
      const h = w / ratio;
      const cx = pageSize ? (pageSize.w - w) / 2 : 100;
      const cy = pageSize ? (pageSize.h - h) / 2 : 100;
      const id = `sig-${Date.now()}`;
      setElements((prev) => [
        ...prev,
        {
          type: "signature",
          id,
          x: cx,
          y: cy,
          width: w,
          height: h,
          dataUrl,
          page: currentPage,
        },
      ]);
      setSelectedElement(id);
      setActiveTool("select");
    };
    img.src = dataUrl;
    setShowSignaturePad(false);
  };

  /* ═══════════════════════════════════════════════
     UPDATE TEXT PROPERTY
     ═══════════════════════════════════════════════ */

  const updateTextProperty = (property: keyof TextElement, value: string | number | boolean) => {
    if (selectedElement) {
      setElements((prev) =>
        prev.map((el) =>
          el.id === selectedElement && el.type === "text" ? { ...el, [property]: value } : el
        )
      );
    }
  };


  /* ═══════════════════════════════════════════════
     EFFECTS
     ═══════════════════════════════════════════════ */

  /* Auto-focus the contenteditable when entering edit mode */
  useEffect(() => {
    if (editingText) {
      const timeout = setTimeout(() => {
        const div = textInputRefs.current.get(editingText);
        if (div) {
          div.focus();
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(div);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 10);
      return () => clearTimeout(timeout);
    }
  }, [editingText]);

  /* Track the width available for the page so it fits small screens */
  const hasPages = pageImages.length > 0;
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const measure = () => setAvailWidth(Math.max(0, el.clientWidth - 16));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasPages]);

  /* Global keyboard shortcuts */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingText) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedElement) {
        e.preventDefault();
        deleteSelected();
        return;
      }
      if (e.key === "Escape") {
        setSelectedElement(null);
        setEditingText(null);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingText, selectedElement, undo, redo, deleteSelected]);

  /* ═══════════════════════════════════════════════
     EXPORT — burn all overlays into PDF via pdf-lib
     ═══════════════════════════════════════════════ */

  const handleExport = async () => {
    if (!pdfBytes) return;
    /* Include the text box that is still being typed in */
    let exportElements = elements;
    if (editingText) {
      const liveText = textInputRefs.current.get(editingText)?.innerText ?? "";
      exportElements = elements.map((el) =>
        el.id === editingText && el.type === "text" ? { ...el, text: liveText } : el
      );
      commitTextBox(editingText);
    }
    setProcessing(true);
    setProgress(10);

    try {
      const { PDFDocument, rgb, StandardFonts, degrees } = await import("pdf-lib");
      const pdf = await PDFDocument.load(pdfBytes.slice());
      const fontCache = new Map<string, Awaited<ReturnType<typeof pdf.embedFont>>>();
      const getFont = async (family: string, bold: boolean, italic: boolean) => {
        const f = family.toLowerCase();
        const base = f.includes("courier") ? "courier" : f.includes("times") || f.includes("georgia") ? "times" : "helvetica";
        const table = {
          helvetica: [StandardFonts.Helvetica, StandardFonts.HelveticaBold, StandardFonts.HelveticaOblique, StandardFonts.HelveticaBoldOblique],
          times: [StandardFonts.TimesRoman, StandardFonts.TimesRomanBold, StandardFonts.TimesRomanItalic, StandardFonts.TimesRomanBoldItalic],
          courier: [StandardFonts.Courier, StandardFonts.CourierBold, StandardFonts.CourierOblique, StandardFonts.CourierBoldOblique],
        }[base];
        const name = table[(bold ? 1 : 0) + (italic ? 2 : 0)];
        if (!fontCache.has(name)) fontCache.set(name, await pdf.embedFont(name));
        return fontCache.get(name)!;
      };
      const pages = pdf.getPages();
      setProgress(30);

      const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return rgb(r, g, b);
      };

      for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
        const page = pages[pageIdx];
        const vp = viewportsRef.current[pageIdx];
        const rotation = (((vp?.rotation ?? 0) % 360) + 360) % 360;
        /* Overlay coords are PDF points from the top-left of the rendered page.
           pdf.js knows the crop box offset and page rotation, so let it convert. */
        const toPdf = (x: number, y: number) => {
          if (vp) {
            const [px, py] = vp.convertToPdfPoint(x, y);
            return { x: px, y: py };
          }
          return { x, y: page.getSize().height - y };
        };
        /* Axis-aligned box (top-left x,y + w,h in overlay space) → PDF rect */
        const toPdfRect = (x: number, y: number, w: number, h: number) => {
          const a = toPdf(x, y);
          const b = toPdf(x + w, y + h);
          return {
            x: Math.min(a.x, b.x),
            y: Math.min(a.y, b.y),
            width: Math.abs(b.x - a.x),
            height: Math.abs(b.y - a.y),
          };
        };
        /* Images/text need their own rotation on rotated pages */
        const contentRotate = degrees(rotation);
        const pageElements = exportElements.filter((el) => el.page === pageIdx);

        for (const el of pageElements) {
          /* ── WHITEOUT ── */
          if (el.type === "whiteout") {
            page.drawRectangle({ ...toPdfRect(el.x, el.y, el.width, el.height), color: hexToRgb(el.color) });
          }

          /* ── TEXT ── (matches the on-screen box: 4px/2px padding, line-height 1.3) */
          if (el.type === "text" && el.text.trim()) {
            const font = await getFont(el.fontFamily, el.bold, el.italic);
            const size = el.fontSize;
            const lineH = size * 1.3;
            const maxW = Math.max(10, el.width - 8);
            /* Drop characters the standard fonts cannot encode instead of failing */
            const clean = (t: string) =>
              Array.from(t)
                .map((ch) => {
                  try {
                    font.encodeText(ch);
                    return ch;
                  } catch {
                    return "?";
                  }
                })
                .join("");
            /* Wrap like the browser does (word wrap, then hard break long words) */
            const lines: string[] = [];
            for (const para of clean(el.text).split("\n")) {
              let cur = "";
              for (const word of para.split(/(\s+)/)) {
                const next = cur + word;
                if (font.widthOfTextAtSize(next, size) <= maxW || cur === "") {
                  cur = next;
                } else {
                  lines.push(cur.trimEnd());
                  cur = word.trimStart();
                }
                while (font.widthOfTextAtSize(cur, size) > maxW && cur.length > 1) {
                  let cut = cur.length - 1;
                  while (cut > 1 && font.widthOfTextAtSize(cur.slice(0, cut), size) > maxW) cut--;
                  lines.push(cur.slice(0, cut));
                  cur = cur.slice(cut);
                }
              }
              lines.push(cur);
            }
            lines.forEach((line, idx) => {
              if (!line.trim()) return;
              /* Baseline ≈ top padding + half-leading + ascent ≈ 2 + 1.0 * size */
              const lx = el.x + 4;
              const ly = el.y + 2 + size * 1.0 + idx * lineH;
              const p = toPdf(lx, ly);
              page.drawText(line, { x: p.x, y: p.y, size, font, color: hexToRgb(el.color), rotate: contentRotate });
              if (el.underline) {
                const w = font.widthOfTextAtSize(line, size);
                const a = toPdf(lx, ly + size * 0.12);
                const b = toPdf(lx + w, ly + size * 0.12);
                page.drawLine({ start: a, end: b, thickness: Math.max(0.5, size / 16), color: hexToRgb(el.color) });
              }
            });
          }

          /* ── DRAW ── */
          if (el.type === "draw") {
            const c = hexToRgb(el.color);
            for (let i = 0; i < el.points.length - 1; i++) {
              page.drawLine({
                start: toPdf(el.points[i].x, el.points[i].y),
                end: toPdf(el.points[i + 1].x, el.points[i + 1].y),
                thickness: el.lineWidth,
                color: c,
              });
            }
          }

          /* ── IMAGE / SIGNATURE ── */
          if (el.type === "image" || el.type === "signature") {
            const resp = await fetch(el.dataUrl);
            const imgBytes = new Uint8Array(await resp.arrayBuffer());
            const isPng = imgBytes[0] === 0x89 && imgBytes[1] === 0x50;
            const embedded = isPng ? await pdf.embedPng(imgBytes) : await pdf.embedJpg(imgBytes);
            const r = toPdfRect(el.x, el.y, el.width, el.height);
            if (rotation === 0) {
              page.drawImage(embedded, r);
            } else {
              /* Anchor at the corner that maps to the image's bottom-left */
              const anchor = toPdf(el.x, el.y + el.height);
              page.drawImage(embedded, { x: anchor.x, y: anchor.y, width: el.width, height: el.height, rotate: contentRotate });
            }
          }

          /* ── HIGHLIGHT / UNDERLINE / STRIKETHROUGH ── */
          if (el.type === "highlight") {
            const c = hexToRgb(el.color);
            if (el.style === "highlight") {
              page.drawRectangle({ ...toPdfRect(el.x, el.y, el.width, el.height), color: c, opacity: 0.35 });
            } else {
              const yy = el.style === "underline" ? el.y + el.height : el.y + el.height / 2;
              page.drawLine({ start: toPdf(el.x, yy), end: toPdf(el.x + el.width, yy), thickness: 1.5, color: c });
            }
          }
        }

        setProgress(30 + Math.round(((pageIdx + 1) / pages.length) * 60));
      }

      const edited = await pdf.save();
      setProgress(100);
      downloadPDF(edited, "edited.pdf");
    } catch (err) {
      console.error("Export failed:", err);
      alert(
        err instanceof Error && /encrypt/i.test(err.message)
          ? "This PDF is password-protected. Unlock it first, then edit."
          : "Failed to export PDF. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  /* ═══════════════════════════════════════════════
     DERIVED STATE
     ═══════════════════════════════════════════════ */

  const currentPageElements = elements.filter((el) => el.page === currentPage);

  /* ═══════════════════════════════════════════════
     TOOL DEFINITIONS
     ═══════════════════════════════════════════════ */

  const tools: { id: EditTool; icon: typeof Pencil; label: string }[] = [
    { id: "select", icon: MousePointer, label: "Select" },
    { id: "text", icon: Type, label: "Add Text" },
    { id: "whiteout", icon: Square, label: "Whiteout" },
    { id: "highlight", icon: Highlighter, label: "Highlight" },
    { id: "draw", icon: Pencil, label: "Draw" },
    { id: "image", icon: ImagePlus, label: "Image" },
  ];

  /* ═══════════════════════════════════════════════
     RENDER RESIZE HANDLES
     ═══════════════════════════════════════════════ */

  const renderResizeHandles = () => {
    const hs = "absolute w-3 h-3 bg-white border-2 border-primary rounded-sm z-20";
    return (
      <>
        <div className={hs} style={{ left: -6, top: -6, cursor: "nw-resize" }} />
        <div className={hs} style={{ right: -6, top: -6, cursor: "ne-resize" }} />
        <div className={hs} style={{ left: -6, bottom: -6, cursor: "sw-resize" }} />
        <div className={hs} style={{ right: -6, bottom: -6, cursor: "se-resize" }} />
      </>
    );
  };

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */

  return (
    <ToolLayout
      title="Edit PDF"
      description="Edit text, add content, whiteout, highlight, sign and modify any PDF"
      icon={Pencil}
      color="from-sky-500 to-blue-600"
      processing={processing}
      progress={progress}
    >
      {/* Signature pad modal */}
      {showSignaturePad && (
        <SignaturePadModal
          onInsert={handleSignatureInsert}
          onClose={() => setShowSignaturePad(false)}
        />
      )}

      {pageImages.length === 0 ? (
        /* ── Upload screen ── */
        <div className="space-y-6">
          <FileUpload
            accept=".pdf"
            onFilesSelected={handleFilesSelected}
            files={files}
            onRemoveFile={() => {
              setFiles([]);
              setPageImages([]);
              setPdfBytes(null);
            }}
            label="Upload PDF to edit"
            description="Drop a PDF file here to start editing"
          />
          {files.length > 0 && !processing && pageImages.length === 0 && (
            <div className="flex justify-center">
              <Button onClick={() => handleFilesSelected(files)} className="gradient-primary">
                <Pencil className="h-4 w-4 mr-2" />
                Edit PDF
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* ═══════════════════════════════════════════
           EDITOR INTERFACE
           ═══════════════════════════════════════════ */
        <div className="space-y-3">
          {/* ── Main toolbar ── */}
          <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl border border-border bg-card shadow-sm">
            {/* Tool buttons */}
            <div className="flex items-center gap-1 border-r border-border pr-2">
              {tools.map((tool) => (
                <Button
                  key={tool.id}
                  variant={activeTool === tool.id ? "default" : "ghost"}
                  size="sm"
                  className={cn("h-8 px-2.5 gap-1.5 text-xs", activeTool === tool.id && "gradient-primary")}
                  onClick={() => {
                    if (tool.id === "image") {
                      imageInputRef.current?.click();
                    } else {
                      if (editingText) commitTextBox(editingText);
                      setActiveTool(tool.id);
                      if (tool.id === "text") {
                        setSelectedElement(null);
                        setEditingText(null);
                      }
                    }
                  }}
                  title={tool.label}
                >
                  <tool.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tool.label}</span>
                </Button>
              ))}

              {/* Sign button — opens modal */}
              <Button
                variant={activeTool === "sign" ? "default" : "ghost"}
                size="sm"
                className={cn("h-8 px-2.5 gap-1.5 text-xs", activeTool === "sign" && "gradient-primary")}
                onClick={() => setShowSignaturePad(true)}
                title="Sign"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign</span>
              </Button>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Whiteout color picker */}
            {activeTool === "whiteout" && (
              <div className="flex items-center gap-1.5 border-r border-border pr-2">
                <Input
                  type="color"
                  value={whiteoutColor}
                  onChange={(e) => setWhiteoutColor(e.target.value)}
                  className="h-8 w-8 p-0.5 rounded cursor-pointer"
                  title="Whiteout color"
                />
                <span className="text-xs text-muted-foreground">Fill</span>
              </div>
            )}

            {/* Highlight style & color */}
            {activeTool === "highlight" && (
              <div className="flex items-center gap-1 border-r border-border pr-2">
                <button
                  className={cn("h-7 w-7 flex items-center justify-center rounded text-xs", highlightStyle === "highlight" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                  onClick={() => setHighlightStyle("highlight")}
                  title="Highlight"
                >
                  <Highlighter className="h-3.5 w-3.5" />
                </button>
                <button
                  className={cn("h-7 w-7 flex items-center justify-center rounded text-xs", highlightStyle === "underline" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                  onClick={() => setHighlightStyle("underline")}
                  title="Underline"
                >
                  <Underline className="h-3.5 w-3.5" />
                </button>
                <button
                  className={cn("h-7 w-7 flex items-center justify-center rounded text-xs", highlightStyle === "strikethrough" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                  onClick={() => setHighlightStyle("strikethrough")}
                  title="Strikethrough"
                >
                  <Strikethrough className="h-3.5 w-3.5" />
                </button>
                <Input
                  type="color"
                  value={highlightColor}
                  onChange={(e) => setHighlightColor(e.target.value)}
                  className="h-8 w-8 p-0.5 rounded cursor-pointer"
                  title="Highlight color"
                />
              </div>
            )}

            {/* Draw options */}
            {activeTool === "draw" && (
              <div className="flex items-center gap-1.5 border-r border-border pr-2">
                <Input
                  type="color"
                  value={drawColor}
                  onChange={(e) => setDrawColor(e.target.value)}
                  className="h-8 w-8 p-0.5 rounded cursor-pointer"
                  title="Draw color"
                />
                <Input
                  type="number"
                  value={drawWidth}
                  onChange={(e) => setDrawWidth(parseInt(e.target.value) || 2)}
                  className="h-8 w-12 text-xs"
                  min={1}
                  max={20}
                  title="Line width"
                />
              </div>
            )}

            {/* Undo / Redo / Delete */}
            <div className="flex items-center gap-1 border-r border-border pr-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={undo} disabled={undoStack.length === 0} title="Undo (Ctrl+Z)">
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={redo} disabled={redoStack.length === 0} title="Redo (Ctrl+Y)">
                <Redo2 className="h-3.5 w-3.5" />
              </Button>
              {selectedElement && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={deleteSelected} title="Delete (Del)">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-1 border-r border-border pr-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setZoom(Math.max(0.25, zoom - 0.25))} title="Zoom out">
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setZoom(Math.min(3, zoom + 0.25))} title="Zoom in">
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Export */}
            <Button onClick={handleExport} size="sm" className="h-8 gap-1.5 ml-auto gradient-primary" disabled={processing} title="Apply & Save" aria-label="Apply & Save">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Apply &amp; Save</span>
            </Button>
          </div>

          {/* ── Page navigation ── */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (editingText) commitTextBox(editingText);
                setCurrentPage(Math.max(0, currentPage - 1));
                setSelectedElement(null);
                setEditingText(null);
              }}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              Page {currentPage + 1} of {pageImages.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (editingText) commitTextBox(editingText);
                setCurrentPage(Math.min(pageImages.length - 1, currentPage + 1));
                setSelectedElement(null);
                setEditingText(null);
              }}
              disabled={currentPage === pageImages.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* ═══════════════════════════════════════
             CANVAS AREA — PDF page + overlays
             ═══════════════════════════════════════ */}
          <div ref={scrollAreaRef} className="relative overflow-auto rounded-xl border border-border bg-muted/30 p-2" style={{ maxHeight: "75vh" }}>
            {/* Sizer: takes the scaled size so scrolling matches what is shown */}
            <div
              className="relative mx-auto"
              style={{
                width: (pageSize?.w ?? 0) * displayScale,
                height: (pageSize?.h ?? 0) * displayScale,
              }}
            >
            <div
              ref={canvasContainerRef}
              className="absolute left-0 top-0"
              style={{
                width: pageSize?.w,
                height: pageSize?.h,
                transform: `scale(${displayScale})`,
                transformOrigin: "top left",
                touchAction: activeTool === "select" && !selectedElement ? "auto" : "none",
                cursor:
                  activeTool === "text" ? "text"
                  : activeTool === "whiteout" || activeTool === "draw" || activeTool === "highlight" ? "crosshair"
                  : "default",
              }}
              onPointerDown={handleCanvasMouseDown}
              onPointerMove={handleCanvasMouseMove}
              onPointerUp={handleCanvasMouseUp}
              onDoubleClick={handleCanvasDoubleClick}
              onPointerLeave={(e) => { if (isDrawing) handleCanvasMouseUp(e); }}
            >
              {/* PDF page background: drawn at 1 CSS px per PDF point */}
              {pageImages[currentPage] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pageImages[currentPage]}
                  alt={`Page ${currentPage + 1}`}
                  className="block select-none pointer-events-none"
                  style={{ width: pageSize?.w, height: pageSize?.h, maxWidth: "none" }}
                  draggable={false}
                />
              )}

              {/* ── RENDER ALL ELEMENTS ── */}
              {currentPageElements.map((el) => {
                const isSelected = selectedElement === el.id;

                /* ── WHITEOUT ── */
                if (el.type === "whiteout") {
                  return (
                    <div
                      key={el.id}
                      className={cn("absolute", isSelected && "ring-2 ring-primary")}
                      style={{
                        left: el.x, top: el.y, width: el.width, height: el.height,
                        backgroundColor: el.color,
                        cursor: activeTool === "select" ? "move" : "default",
                      }}
                    >
                      {isSelected && renderResizeHandles()}
                    </div>
                  );
                }

                /* ── HIGHLIGHT / UNDERLINE / STRIKETHROUGH ── */
                if (el.type === "highlight") {
                  return (
                    <div
                      key={el.id}
                      className={cn("absolute", isSelected && "ring-2 ring-primary")}
                      style={{
                        left: el.x, top: el.y, width: el.width, height: el.height,
                        cursor: activeTool === "select" ? "move" : "default",
                        pointerEvents: activeTool === "select" ? "auto" : "none",
                      }}
                    >
                      {el.style === "highlight" && (
                        <div
                          className="w-full h-full"
                          style={{ backgroundColor: el.color, opacity: 0.35 }}
                        />
                      )}
                      {el.style === "underline" && (
                        <div
                          className="absolute bottom-0 left-0 w-full"
                          style={{ height: 3, backgroundColor: el.color }}
                        />
                      )}
                      {el.style === "strikethrough" && (
                        <div
                          className="absolute left-0 w-full"
                          style={{ top: "50%", height: 3, backgroundColor: el.color, transform: "translateY(-50%)" }}
                        />
                      )}
                      {isSelected && renderResizeHandles()}
                    </div>
                  );
                }

                /* ── TEXT ── */
                if (el.type === "text") {
                  const isEditing = editingText === el.id;
                  return (
                    <div
                      key={el.id}
                      className={cn("absolute group", isSelected && "ring-2 ring-primary rounded-sm")}
                      style={{
                        left: el.x, top: el.y, width: el.width, minHeight: el.height,
                        cursor: activeTool === "select" ? (isEditing ? "text" : "move") : "default",
                      }}
                    >
                      {/* Floating toolbar */}
                      {isSelected && isEditing && (
                        <div
                          className="absolute bottom-full left-0 mb-2 flex items-center gap-1 p-1.5 rounded-lg border border-border bg-card shadow-lg z-50"
                          style={{ whiteSpace: "nowrap" }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <select
                            value={el.fontFamily}
                            onChange={(e) => updateTextProperty("fontFamily", e.target.value)}
                            className="h-7 text-xs rounded border border-border bg-background px-1 outline-none"
                          >
                            {FONT_FAMILIES.map((f) => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                          <select
                            value={el.fontSize}
                            onChange={(e) => updateTextProperty("fontSize", parseInt(e.target.value))}
                            className="h-7 w-14 text-xs rounded border border-border bg-background px-1 outline-none"
                          >
                            {FONT_SIZES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <button
                            className={cn("h-7 w-7 flex items-center justify-center rounded text-xs", el.bold ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                            onClick={() => updateTextProperty("bold", !el.bold)}
                            title="Bold"
                          >
                            <Bold className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className={cn("h-7 w-7 flex items-center justify-center rounded text-xs", el.italic ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                            onClick={() => updateTextProperty("italic", !el.italic)}
                            title="Italic"
                          >
                            <Italic className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className={cn("h-7 w-7 flex items-center justify-center rounded text-xs", el.underline ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                            onClick={() => updateTextProperty("underline", !el.underline)}
                            title="Underline"
                          >
                            <Underline className="h-3.5 w-3.5" />
                          </button>
                          <input
                            type="color"
                            value={el.color}
                            onChange={(e) => updateTextProperty("color", e.target.value)}
                            className="h-7 w-7 p-0.5 rounded cursor-pointer border border-border"
                            title="Text color"
                          />
                        </div>
                      )}

                      {/* Editable / display text content */}
                      {isEditing ? (
                        <div
                          data-text-editor
                          ref={(node) => {
                            if (node) {
                              textInputRefs.current.set(el.id, node);
                              if (node.innerText !== el.text) {
                                node.innerText = el.text;
                              }
                            } else {
                              textInputRefs.current.delete(el.id);
                            }
                          }}
                          contentEditable
                          suppressContentEditableWarning
                          className="outline-none w-full min-h-[1.5em] break-words"
                          style={{
                            color: el.color,
                            fontSize: el.fontSize,
                            fontWeight: el.bold ? "bold" : "normal",
                            fontStyle: el.italic ? "italic" : "normal",
                            textDecoration: el.underline ? "underline" : "none",
                            fontFamily: el.fontFamily,
                            lineHeight: 1.3,
                            padding: "2px 4px",
                            caretColor: el.color,
                            wordBreak: "break-word",
                            whiteSpace: "pre-wrap",
                          }}
                          onInput={(e) => {
                            const div = e.currentTarget;
                            const text = div.innerText || "";
                            setElements((prev) =>
                              prev.map((item) =>
                                item.id === el.id && item.type === "text"
                                  ? { ...item, text, height: Math.max(el.fontSize * 1.5, div.scrollHeight) }
                                  : item
                              )
                            );
                          }}
                          onBlur={() => { pushUndo(); commitTextBox(el.id); }}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              e.preventDefault();
                              pushUndo();
                              commitTextBox(el.id);
                              setSelectedElement(null);
                            }
                            e.stopPropagation();
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div
                          data-text-editor
                          className="w-full min-h-[1.5em] break-words select-none"
                          style={{
                            color: el.color,
                            fontSize: el.fontSize,
                            fontWeight: el.bold ? "bold" : "normal",
                            fontStyle: el.italic ? "italic" : "normal",
                            textDecoration: el.underline ? "underline" : "none",
                            fontFamily: el.fontFamily,
                            lineHeight: 1.3,
                            padding: "2px 4px",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (activeTool === "select") {
                              setSelectedElement(el.id);
                              setEditingText(el.id);
                            }
                          }}
                        >
                          {el.text || "\u200B"}
                        </div>
                      )}

                      {isSelected && !isEditing && renderResizeHandles()}
                    </div>
                  );
                }

                /* ── IMAGE ── */
                if (el.type === "image") {
                  return (
                    <div
                      key={el.id}
                      className={cn("absolute", isSelected && "ring-2 ring-primary")}
                      style={{
                        left: el.x, top: el.y, width: el.width, height: el.height,
                        cursor: activeTool === "select" ? "move" : "default",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={el.dataUrl} alt="Placed image" className="w-full h-full object-contain pointer-events-none" draggable={false} />
                      {isSelected && renderResizeHandles()}
                    </div>
                  );
                }

                /* ── SIGNATURE ── */
                if (el.type === "signature") {
                  return (
                    <div
                      key={el.id}
                      className={cn("absolute", isSelected && "ring-2 ring-primary")}
                      style={{
                        left: el.x, top: el.y, width: el.width, height: el.height,
                        cursor: activeTool === "select" ? "move" : "default",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={el.dataUrl} alt="Signature" className="w-full h-full object-contain pointer-events-none" draggable={false} />
                      {isSelected && renderResizeHandles()}
                    </div>
                  );
                }

                /* ── DRAW ── */
                if (el.type === "draw") {
                  return (
                    <svg
                      key={el.id}
                      className={cn("absolute inset-0 pointer-events-none", isSelected && "drop-shadow-[0_0_3px_rgba(139,92,246,0.8)]")}
                      style={{ width: "100%", height: "100%" }}
                    >
                      <polyline
                        points={el.points.map((p) => `${p.x},${p.y}`).join(" ")}
                        fill="none"
                        stroke={el.color}
                        strokeWidth={el.lineWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  );
                }

                return null;
              })}

              {/* ── Whiteout draw preview ── */}
              {activeTool === "whiteout" && isDrawing && currentDraw && currentDraw.length === 2 && (
                <div
                  className="absolute border-2 border-dashed border-primary/50 pointer-events-none"
                  style={{
                    left: Math.min(currentDraw[0].x, currentDraw[1].x),
                    top: Math.min(currentDraw[0].y, currentDraw[1].y),
                    width: Math.abs(currentDraw[1].x - currentDraw[0].x),
                    height: Math.abs(currentDraw[1].y - currentDraw[0].y),
                    backgroundColor: `${whiteoutColor}80`,
                  }}
                />
              )}

              {/* ── Highlight draw preview ── */}
              {activeTool === "highlight" && isDrawing && currentDraw && currentDraw.length === 2 && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: Math.min(currentDraw[0].x, currentDraw[1].x),
                    top: Math.min(currentDraw[0].y, currentDraw[1].y),
                    width: Math.abs(currentDraw[1].x - currentDraw[0].x),
                    height: Math.abs(currentDraw[1].y - currentDraw[0].y),
                    backgroundColor: highlightStyle === "highlight" ? `${highlightColor}50` : "transparent",
                    borderBottom: highlightStyle === "underline" ? `3px solid ${highlightColor}` : "none",
                  }}
                >
                  {highlightStyle === "strikethrough" && (
                    <div className="absolute left-0 w-full" style={{ top: "50%", height: 3, backgroundColor: highlightColor, transform: "translateY(-50%)" }} />
                  )}
                </div>
              )}

              {/* ── Freehand draw preview ── */}
              {activeTool === "draw" && isDrawing && currentDraw && currentDraw.length > 1 && (
                <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }}>
                  <polyline
                    points={currentDraw.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke={drawColor}
                    strokeWidth={drawWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.7}
                  />
                </svg>
              )}
            </div>
            </div>
          </div>

          {/* ── Helper text ── */}
          <p className="text-xs text-center text-muted-foreground">
            {activeTool === "select" && "Click to select. Double-click text to edit. Drag to move. Drag corners to resize."}
            {activeTool === "text" && "Click anywhere to place a text box. Start typing immediately."}
            {activeTool === "whiteout" && "Click and drag to draw a white rectangle over content."}
            {activeTool === "highlight" && "Click and drag over text to highlight, underline, or strike through."}
            {activeTool === "draw" && "Click and drag to draw freehand."}
            {activeTool === "image" && "Select an image file to place on the page."}
          </p>

          {/* ── Upload different PDF ── */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (editingText) commitTextBox(editingText);
                setFiles([]);
                setPageImages([]);
                setPageSizes([]);
                setPdfBytes(null);
                setElements([]);
                setSelectedElement(null);
                setEditingText(null);
                setUndoStack([]);
                setRedoStack([]);
              }}
            >
              Upload Different PDF
            </Button>
          </div>
        </div>
      )}
      <ToolSEOContent toolId="edit-pdf" toolName="Edit PDF" />
    </ToolLayout>
  );
}
