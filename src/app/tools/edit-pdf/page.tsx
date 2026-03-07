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
  PenTool,
  Highlighter,
  Strikethrough,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { downloadPDF } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ToolSEOContent } from "@/components/seo/tool-seo-content";

/* ─────────────────────────────────────────────
   Type definitions for all editor elements
   ───────────────────────────────────────────── */

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

type EditElement = TextElement | WhiteoutElement | ImageElement | DrawElement;

/* ─────────────────────────────────────────────
   Available font families for the text toolbar
   ───────────────────────────────────────────── */
const FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
];

/* ─────────────────────────────────────────────
   Font size presets for quick selection
   ───────────────────────────────────────────── */
const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

/* ─────────────────────────────────────────────
   Minimum resize dimensions
   ───────────────────────────────────────────── */
const MIN_WIDTH = 40;
const MIN_HEIGHT = 20;

export default function EditPDFPage() {
  /* ── File and PDF state ── */
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);

  /* ── Tool state ── */
  const [activeTool, setActiveTool] = useState<EditTool>("text");

  /* ── Element management ── */
  const [elements, setElements] = useState<EditElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<EditElement[][]>([]);
  const [redoStack, setRedoStack] = useState<EditElement[][]>([]);

  /* ── Default text formatting (applied to new text boxes) ── */
  const [defaultFontFamily, setDefaultFontFamily] = useState("Arial");
  const [defaultFontSize, setDefaultFontSize] = useState(16);
  const [defaultTextColor, setDefaultTextColor] = useState("#000000");
  const [defaultBold, setDefaultBold] = useState(false);
  const [defaultItalic, setDefaultItalic] = useState(false);
  const [defaultUnderline, setDefaultUnderline] = useState(false);

  /* ── Whiteout / Draw state ── */
  const [whiteoutColor, setWhiteoutColor] = useState("#ffffff");
  const [drawColor, setDrawColor] = useState("#000000");
  const [drawWidth, setDrawWidth] = useState(2);

  /* ── Interaction state ── */
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDraw, setCurrentDraw] = useState<{ x: number; y: number }[] | null>(null);
  const [dragState, setDragState] = useState<{
    elementId: string;
    offsetX: number;
    offsetY: number;
    type: "move" | "resize";
    handle?: string; // "nw" | "ne" | "sw" | "se"
    startWidth?: number;
    startHeight?: number;
    startX?: number;
    startY?: number;
  } | null>(null);

  /* ── Refs ── */
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textInputRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  /* ─────────────────────────────────────────────
     Undo / Redo helpers
     ───────────────────────────────────────────── */
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

  /* ─────────────────────────────────────────────
     Load PDF and render all pages as images
     ───────────────────────────────────────────── */
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
        const bytes = await newFiles[0].arrayBuffer();
        setPdfBytes(bytes);
        setProgress(20);

        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.mjs",
          import.meta.url
        ).toString();

        const pdf = await pdfjs.getDocument({ data: bytes }).promise;
        const images: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;

          await (page.render({
            canvasContext: ctx,
            viewport,
            canvas,
          } as any)).promise;

          images.push(canvas.toDataURL("image/png"));
          setProgress(20 + Math.round((i / pdf.numPages) * 70));
        }

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

  /* ─────────────────────────────────────────────
     Coordinate helpers — convert mouse pos to
     coordinates relative to the PDF canvas
     ───────────────────────────────────────────── */
  const getRelativePos = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  };

  /* ─────────────────────────────────────────────
     Hit-test: is a point inside an element?
     ───────────────────────────────────────────── */
  const isPointInElement = (pos: { x: number; y: number }, el: EditElement): boolean => {
    if (el.type === "text") {
      return (
        pos.x >= el.x &&
        pos.x <= el.x + el.width &&
        pos.y >= el.y &&
        pos.y <= el.y + el.height
      );
    }
    if (el.type === "whiteout" || el.type === "image") {
      return (
        pos.x >= el.x &&
        pos.x <= el.x + el.width &&
        pos.y >= el.y &&
        pos.y <= el.y + el.height
      );
    }
    if (el.type === "draw") {
      for (const pt of el.points) {
        const dist = Math.sqrt((pos.x - pt.x) ** 2 + (pos.y - pt.y) ** 2);
        if (dist < 10) return true;
      }
    }
    return false;
  };

  /* ─────────────────────────────────────────────
     Check if a point is on one of the resize
     handles (corners) of a selected element
     ───────────────────────────────────────────── */
  const getResizeHandle = (
    pos: { x: number; y: number },
    el: EditElement
  ): string | null => {
    if (el.type === "draw") return null;
    const handleSize = 8;
    const ex = el.x;
    const ey = el.y;
    const ew = el.type === "text" ? el.width : el.width;
    const eh = el.type === "text" ? el.height : el.height;

    const handles: { name: string; cx: number; cy: number }[] = [
      { name: "nw", cx: ex, cy: ey },
      { name: "ne", cx: ex + ew, cy: ey },
      { name: "sw", cx: ex, cy: ey + eh },
      { name: "se", cx: ex + ew, cy: ey + eh },
    ];

    for (const h of handles) {
      if (
        Math.abs(pos.x - h.cx) <= handleSize &&
        Math.abs(pos.y - h.cy) <= handleSize
      ) {
        return h.name;
      }
    }
    return null;
  };

  /* ─────────────────────────────────────────────
     Commit a text box: read inner HTML, strip
     empty boxes, sync the text back to state
     ───────────────────────────────────────────── */
  const commitTextBox = useCallback(
    (elementId: string) => {
      const div = textInputRefs.current.get(elementId);
      if (!div) return;

      const text = div.innerText || "";

      setElements((prev) =>
        prev
          .map((el) => {
            if (el.id !== elementId || el.type !== "text") return el;
            return { ...el, text };
          })
          // Remove empty text boxes
          .filter((el) => {
            if (el.type === "text" && el.id === elementId && text.trim() === "") {
              return false;
            }
            return true;
          })
      );

      setEditingText(null);
    },
    []
  );

  /* ─────────────────────────────────────────────
     Mouse handlers for the canvas area
     ───────────────────────────────────────────── */
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't process events on the text editing divs — they handle themselves
    const target = e.target as HTMLElement;
    if (target.closest("[data-text-editor]")) return;

    const pos = getRelativePos(e);

    /* ── SELECT tool ── */
    if (activeTool === "select") {
      const pageElements = elements.filter((el) => el.page === currentPage);

      // First check if clicking on a resize handle of the selected element
      if (selectedElement) {
        const selEl = pageElements.find((el) => el.id === selectedElement);
        if (selEl) {
          const handle = getResizeHandle(pos, selEl);
          if (handle) {
            setDragState({
              elementId: selEl.id,
              offsetX: pos.x,
              offsetY: pos.y,
              type: "resize",
              handle,
              startWidth: selEl.type === "draw" ? 0 : selEl.width,
              startHeight: selEl.type === "draw" ? 0 : selEl.height,
              startX: selEl.type === "draw" ? 0 : selEl.x,
              startY: selEl.type === "draw" ? 0 : selEl.y,
            });
            return;
          }
        }
      }

      // Check if clicking on an element to select/move it
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
          // If clicking a text element, don't start editing immediately — require double-click
          if (editingText && editingText !== el.id) {
            commitTextBox(editingText);
          }
          return;
        }
      }

      // Clicking on empty space — deselect all
      if (editingText) {
        commitTextBox(editingText);
      }
      setSelectedElement(null);
      setEditingText(null);
      return;
    }

    /* ── TEXT tool: click to place a new text box ── */
    if (activeTool === "text") {
      // First commit any existing editing text
      if (editingText) {
        commitTextBox(editingText);
      }

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

    /* ── WHITEOUT tool: click-drag to draw rectangle ── */
    if (activeTool === "whiteout") {
      if (editingText) commitTextBox(editingText);
      setIsDrawing(true);
      setDrawStart(pos);
      return;
    }

    /* ── DRAW tool: freehand drawing ── */
    if (activeTool === "draw") {
      if (editingText) commitTextBox(editingText);
      setIsDrawing(true);
      setCurrentDraw([pos]);
      return;
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const pos = getRelativePos(e);

    /* ── Drag (move) or resize an element ── */
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
              return {
                ...el,
                points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
              };
            }
            return {
              ...el,
              x: pos.x - dragState.offsetX,
              y: pos.y - dragState.offsetY,
            };
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

            let newX = el.x;
            let newY = el.y;
            let newW = el.type === "text" ? el.width : el.width;
            let newH = el.type === "text" ? el.height : el.height;

            switch (dragState.handle) {
              case "se":
                newW = Math.max(MIN_WIDTH, sw + dx);
                newH = Math.max(MIN_HEIGHT, sh + dy);
                break;
              case "sw":
                newW = Math.max(MIN_WIDTH, sw - dx);
                newH = Math.max(MIN_HEIGHT, sh + dy);
                newX = sx + (sw - newW);
                break;
              case "ne":
                newW = Math.max(MIN_WIDTH, sw + dx);
                newH = Math.max(MIN_HEIGHT, sh - dy);
                newY = sy + (sh - newH);
                break;
              case "nw":
                newW = Math.max(MIN_WIDTH, sw - dx);
                newH = Math.max(MIN_HEIGHT, sh - dy);
                newX = sx + (sw - newW);
                newY = sy + (sh - newH);
                break;
            }

            return { ...el, x: newX, y: newY, width: newW, height: newH };
          })
        );
        return;
      }
    }

    /* ── Whiteout preview ── */
    if (activeTool === "whiteout" && isDrawing && drawStart) {
      setCurrentDraw([drawStart, pos]);
      return;
    }

    /* ── Freehand draw ── */
    if (activeTool === "draw" && isDrawing && currentDraw) {
      setCurrentDraw((prev) => [...(prev || []), pos]);
      return;
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const pos = getRelativePos(e);

    /* ── End drag/resize ── */
    if (dragState) {
      pushUndo();
      setDragState(null);
      return;
    }

    /* ── End whiteout draw ── */
    if (activeTool === "whiteout" && isDrawing && drawStart) {
      const x = Math.min(drawStart.x, pos.x);
      const y = Math.min(drawStart.y, pos.y);
      const w = Math.abs(pos.x - drawStart.x);
      const h = Math.abs(pos.y - drawStart.y);

      if (w > 5 && h > 5) {
        pushUndo();
        const newEl: WhiteoutElement = {
          type: "whiteout",
          id: `whiteout-${Date.now()}`,
          x,
          y,
          width: w,
          height: h,
          color: whiteoutColor,
          page: currentPage,
        };
        setElements((prev) => [...prev, newEl]);
      }
      setIsDrawing(false);
      setDrawStart(null);
      setCurrentDraw(null);
      return;
    }

    /* ── End freehand draw ── */
    if (activeTool === "draw" && isDrawing && currentDraw && currentDraw.length > 1) {
      pushUndo();
      const newEl: DrawElement = {
        type: "draw",
        id: `draw-${Date.now()}`,
        points: currentDraw,
        color: drawColor,
        lineWidth: drawWidth,
        page: currentPage,
      };
      setElements((prev) => [...prev, newEl]);
      setIsDrawing(false);
      setCurrentDraw(null);
      return;
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentDraw(null);
    setDragState(null);
  };

  /* ─────────────────────────────────────────────
     Double-click handler for editing existing
     text boxes in select mode
     ───────────────────────────────────────────── */
  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== "select") return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-text-editor]")) return;

    const pos = getRelativePos(e);
    const pageElements = elements.filter((el) => el.page === currentPage);

    for (let i = pageElements.length - 1; i >= 0; i--) {
      const el = pageElements[i];
      if (el.type === "text" && isPointInElement(pos, el)) {
        setSelectedElement(el.id);
        setEditingText(el.id);
        return;
      }
    }
  };

  /* ─────────────────────────────────────────────
     Delete the currently selected element
     ───────────────────────────────────────────── */
  const deleteSelected = () => {
    if (!selectedElement) return;
    pushUndo();
    setElements((prev) => prev.filter((el) => el.id !== selectedElement));
    setSelectedElement(null);
    setEditingText(null);
  };

  /* ─────────────────────────────────────────────
     Handle image upload
     ───────────────────────────────────────────── */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      pushUndo();
      const img = new window.Image();
      img.onload = () => {
        const maxW = 300;
        const ratio = img.width / img.height;
        const w = Math.min(img.width, maxW);
        const h = w / ratio;

        const newEl: ImageElement = {
          type: "image",
          id: `img-${Date.now()}`,
          x: 50,
          y: 50,
          width: w,
          height: h,
          dataUrl: reader.result as string,
          page: currentPage,
        };
        setElements((prev) => [...prev, newEl]);
        setSelectedElement(newEl.id);
        setActiveTool("select");
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  /* ─────────────────────────────────────────────
     Update a formatting property on the selected
     text element (or update the defaults)
     ───────────────────────────────────────────── */
  const updateTextProperty = (
    property: keyof TextElement,
    value: string | number | boolean
  ) => {
    if (selectedElement) {
      setElements((prev) =>
        prev.map((el) =>
          el.id === selectedElement && el.type === "text"
            ? { ...el, [property]: value }
            : el
        )
      );
    }
  };

  /* ─────────────────────────────────────────────
     Get the currently selected text element
     ───────────────────────────────────────────── */
  const getSelectedTextEl = (): TextElement | null => {
    if (!selectedElement) return null;
    const el = elements.find((e) => e.id === selectedElement);
    if (el && el.type === "text") return el;
    return null;
  };

  /* ─────────────────────────────────────────────
     Auto-focus the contenteditable div when
     editingText changes
     ───────────────────────────────────────────── */
  useEffect(() => {
    if (editingText) {
      // Small timeout to let the DOM render first
      const timeout = setTimeout(() => {
        const div = textInputRefs.current.get(editingText);
        if (div) {
          div.focus();
          // Place cursor at end of text
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(div);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 10);
      return () => clearTimeout(timeout);
    }
  }, [editingText]);

  /* ─────────────────────────────────────────────
     Keyboard shortcut: Delete/Backspace removes
     selected element (when not editing text)
     ───────────────────────────────────────────── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept keyboard when editing text
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

      // Ctrl+Z / Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Shift+Z / Ctrl+Y for redo
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingText, selectedElement, undo, redo, deleteSelected]);

  /* ─────────────────────────────────────────────
     Export: burn all overlays into PDF with pdf-lib
     ───────────────────────────────────────────── */
  const handleExport = async () => {
    if (!pdfBytes) return;
    setProcessing(true);
    setProgress(10);

    try {
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
      const pdf = await PDFDocument.load(pdfBytes);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const fontItalic = await pdf.embedFont(StandardFonts.HelveticaOblique);
      const fontBoldItalic = await pdf.embedFont(StandardFonts.HelveticaBoldOblique);
      const pages = pdf.getPages();

      setProgress(30);

      // PDF.js rendered at scale=2, so divide coordinates by 2 for PDF space
      const scale = 2;

      for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
        const page = pages[pageIdx];
        const { height } = page.getSize();
        const pageElements = elements.filter((el) => el.page === pageIdx);

        for (const el of pageElements) {
          if (el.type === "whiteout") {
            const hex = el.color;
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            page.drawRectangle({
              x: el.x / scale,
              y: height - (el.y + el.height) / scale,
              width: el.width / scale,
              height: el.height / scale,
              color: rgb(r, g, b),
            });
          }

          if (el.type === "text" && el.text.trim()) {
            const hex = el.color;
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;

            let selectedFont = font;
            if (el.bold && el.italic) selectedFont = fontBoldItalic;
            else if (el.bold) selectedFont = fontBold;
            else if (el.italic) selectedFont = fontItalic;

            // Split text into lines and draw each line
            const lines = el.text.split("\n");
            const lineHeight = (el.fontSize / scale) * 1.3;

            lines.forEach((line, lineIdx) => {
              if (line.trim()) {
                page.drawText(line, {
                  x: el.x / scale,
                  y: height - (el.y / scale) - (el.fontSize / scale) - (lineIdx * lineHeight),
                  size: el.fontSize / scale,
                  font: selectedFont,
                  color: rgb(r, g, b),
                });
              }
            });
          }

          if (el.type === "draw") {
            const hex = el.color;
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;

            for (let i = 0; i < el.points.length - 1; i++) {
              const p1 = el.points[i];
              const p2 = el.points[i + 1];
              page.drawLine({
                start: { x: p1.x / scale, y: height - p1.y / scale },
                end: { x: p2.x / scale, y: height - p2.y / scale },
                thickness: el.lineWidth / scale,
                color: rgb(r, g, b),
              });
            }
          }

          if (el.type === "image") {
            try {
              const resp = await fetch(el.dataUrl);
              const imgBytes = await resp.arrayBuffer();
              let embeddedImg;
              if (el.dataUrl.includes("image/png")) {
                embeddedImg = await pdf.embedPng(imgBytes);
              } else {
                embeddedImg = await pdf.embedJpg(imgBytes);
              }
              page.drawImage(embeddedImg, {
                x: el.x / scale,
                y: height - (el.y + el.height) / scale,
                width: el.width / scale,
                height: el.height / scale,
              });
            } catch {
              // Skip failed image embeds
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
      alert("Failed to export PDF. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  /* ─────────────────────────────────────────────
     Filter elements for the current page only
     ───────────────────────────────────────────── */
  const currentPageElements = elements.filter((el) => el.page === currentPage);
  const selectedTextEl = getSelectedTextEl();

  /* ─────────────────────────────────────────────
     Tool definitions for the main toolbar
     ───────────────────────────────────────────── */
  const tools: { id: EditTool; icon: typeof Pencil; label: string }[] = [
    { id: "select", icon: MousePointer, label: "Select" },
    { id: "text", icon: Type, label: "Add Text" },
    { id: "whiteout", icon: Square, label: "Whiteout" },
    { id: "draw", icon: Pencil, label: "Draw" },
    { id: "image", icon: ImagePlus, label: "Image" },
  ];

  /* ─────────────────────────────────────────────
     Render resize handles for the selected element
     ───────────────────────────────────────────── */
  const renderResizeHandles = (el: EditElement) => {
    if (el.type === "draw") return null;
    const w = el.width;
    const h = el.height;

    const handleStyle =
      "absolute w-3 h-3 bg-white border-2 border-primary rounded-sm z-20";
    return (
      <>
        <div className={handleStyle} style={{ left: -6, top: -6, cursor: "nw-resize" }} data-handle="nw" />
        <div className={handleStyle} style={{ right: -6, top: -6, cursor: "ne-resize" }} data-handle="ne" />
        <div className={handleStyle} style={{ left: -6, bottom: -6, cursor: "sw-resize" }} data-handle="sw" />
        <div className={handleStyle} style={{ right: -6, bottom: -6, cursor: "se-resize" }} data-handle="se" />
      </>
    );
  };

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <ToolLayout
      title="Edit PDF"
      description="Edit text, add content, whiteout and modify any PDF — Sejda-like experience"
      icon={Pencil}
      color="from-sky-500 to-blue-600"
      processing={processing}
      progress={progress}
    >
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
        /* ── Editor interface ── */
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
                  className={cn(
                    "h-8 px-2.5 gap-1.5 text-xs",
                    activeTool === tool.id && "gradient-primary"
                  )}
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
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Whiteout color */}
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
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={undo}
                disabled={undoStack.length === 0}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={redo}
                disabled={redoStack.length === 0}
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </Button>
              {selectedElement && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive"
                  onClick={deleteSelected}
                  title="Delete (Del)"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-1 border-r border-border pr-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                title="Zoom out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                title="Zoom in"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Export button */}
            <Button
              onClick={handleExport}
              size="sm"
              className="h-8 gap-1.5 ml-auto gradient-primary"
              disabled={processing}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Apply & Save</span>
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

          {/* ── Canvas area with overlaid elements ── */}
          <div
            className="relative overflow-auto rounded-xl border border-border bg-muted/30 flex justify-center"
            style={{ maxHeight: "75vh" }}
          >
            <div
              ref={canvasContainerRef}
              className="relative inline-block"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
                cursor:
                  activeTool === "text"
                    ? "text"
                    : activeTool === "whiteout" || activeTool === "draw"
                    ? "crosshair"
                    : "default",
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onDoubleClick={handleCanvasDoubleClick}
              onMouseLeave={() => {
                if (isDrawing) handleCanvasMouseUp({} as any);
              }}
            >
              {/* PDF page background image */}
              {pageImages[currentPage] && (
                <img
                  src={pageImages[currentPage]}
                  alt={`Page ${currentPage + 1}`}
                  className="block select-none pointer-events-none"
                  draggable={false}
                />
              )}

              {/* ── Render all elements for current page ── */}
              {currentPageElements.map((el) => {
                const isSelected = selectedElement === el.id;

                /* ── WHITEOUT ELEMENT ── */
                if (el.type === "whiteout") {
                  return (
                    <div
                      key={el.id}
                      className={cn("absolute", isSelected && "ring-2 ring-primary")}
                      style={{
                        left: el.x,
                        top: el.y,
                        width: el.width,
                        height: el.height,
                        backgroundColor: el.color,
                        cursor: activeTool === "select" ? "move" : "default",
                      }}
                    >
                      {isSelected && renderResizeHandles(el)}
                    </div>
                  );
                }

                /* ── TEXT ELEMENT ── */
                if (el.type === "text") {
                  const isEditing = editingText === el.id;

                  return (
                    <div
                      key={el.id}
                      className={cn(
                        "absolute group",
                        isSelected && "ring-2 ring-primary rounded-sm"
                      )}
                      style={{
                        left: el.x,
                        top: el.y,
                        width: el.width,
                        minHeight: el.height,
                        cursor: activeTool === "select" ? (isEditing ? "text" : "move") : "default",
                      }}
                    >
                      {/* ── Floating toolbar above text box (visible when editing) ── */}
                      {isSelected && isEditing && (
                        <div
                          className="absolute bottom-full left-0 mb-2 flex items-center gap-1 p-1.5 rounded-lg border border-border bg-card shadow-lg z-50"
                          style={{ whiteSpace: "nowrap" }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          {/* Font family selector */}
                          <select
                            value={el.fontFamily}
                            onChange={(e) => updateTextProperty("fontFamily", e.target.value)}
                            className="h-7 text-xs rounded border border-border bg-background px-1 outline-none"
                          >
                            {FONT_FAMILIES.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>

                          {/* Font size selector */}
                          <select
                            value={el.fontSize}
                            onChange={(e) =>
                              updateTextProperty("fontSize", parseInt(e.target.value))
                            }
                            className="h-7 w-14 text-xs rounded border border-border bg-background px-1 outline-none"
                          >
                            {FONT_SIZES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>

                          {/* Bold toggle */}
                          <button
                            className={cn(
                              "h-7 w-7 flex items-center justify-center rounded text-xs",
                              el.bold
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            )}
                            onClick={() => updateTextProperty("bold", !el.bold)}
                            title="Bold"
                          >
                            <Bold className="h-3.5 w-3.5" />
                          </button>

                          {/* Italic toggle */}
                          <button
                            className={cn(
                              "h-7 w-7 flex items-center justify-center rounded text-xs",
                              el.italic
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            )}
                            onClick={() => updateTextProperty("italic", !el.italic)}
                            title="Italic"
                          >
                            <Italic className="h-3.5 w-3.5" />
                          </button>

                          {/* Underline toggle */}
                          <button
                            className={cn(
                              "h-7 w-7 flex items-center justify-center rounded text-xs",
                              el.underline
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            )}
                            onClick={() => updateTextProperty("underline", !el.underline)}
                            title="Underline"
                          >
                            <Underline className="h-3.5 w-3.5" />
                          </button>

                          {/* Text color picker */}
                          <input
                            type="color"
                            value={el.color}
                            onChange={(e) => updateTextProperty("color", e.target.value)}
                            className="h-7 w-7 p-0.5 rounded cursor-pointer border border-border"
                            title="Text color"
                          />
                        </div>
                      )}

                      {/* ── The actual editable text area ── */}
                      {isEditing ? (
                        <div
                          data-text-editor
                          ref={(node) => {
                            if (node) {
                              textInputRefs.current.set(el.id, node);
                              // Set initial text content when entering edit mode
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
                            // Auto-expand: update height based on content
                            const div = e.currentTarget;
                            const text = div.innerText || "";
                            setElements((prev) =>
                              prev.map((item) =>
                                item.id === el.id && item.type === "text"
                                  ? {
                                      ...item,
                                      text,
                                      height: Math.max(
                                        el.fontSize * 1.5,
                                        div.scrollHeight
                                      ),
                                    }
                                  : item
                              )
                            );
                          }}
                          onBlur={() => {
                            // Commit text when clicking outside
                            pushUndo();
                            commitTextBox(el.id);
                          }}
                          onKeyDown={(e) => {
                            // Escape to commit and deselect
                            if (e.key === "Escape") {
                              e.preventDefault();
                              pushUndo();
                              commitTextBox(el.id);
                              setSelectedElement(null);
                            }
                            // Stop propagation so global shortcuts don't fire
                            e.stopPropagation();
                          }}
                          onMouseDown={(e) => {
                            // Let text cursor/selection work normally inside the editor
                            e.stopPropagation();
                          }}
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

                      {/* Resize handles for text boxes */}
                      {isSelected && !isEditing && renderResizeHandles(el)}
                    </div>
                  );
                }

                /* ── IMAGE ELEMENT ── */
                if (el.type === "image") {
                  return (
                    <div
                      key={el.id}
                      className={cn("absolute", isSelected && "ring-2 ring-primary")}
                      style={{
                        left: el.x,
                        top: el.y,
                        width: el.width,
                        height: el.height,
                        cursor: activeTool === "select" ? "move" : "default",
                      }}
                    >
                      <img
                        src={el.dataUrl}
                        alt="Placed image"
                        className="w-full h-full object-contain pointer-events-none"
                        draggable={false}
                      />
                      {isSelected && renderResizeHandles(el)}
                    </div>
                  );
                }

                /* ── DRAW ELEMENT ── */
                if (el.type === "draw") {
                  return (
                    <svg
                      key={el.id}
                      className={cn(
                        "absolute inset-0 pointer-events-none",
                        isSelected &&
                          "drop-shadow-[0_0_3px_rgba(139,92,246,0.8)]"
                      )}
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
              {activeTool === "whiteout" &&
                isDrawing &&
                currentDraw &&
                currentDraw.length === 2 && (
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

              {/* ── Freehand draw preview ── */}
              {activeTool === "draw" &&
                isDrawing &&
                currentDraw &&
                currentDraw.length > 1 && (
                  <svg
                    className="absolute inset-0 pointer-events-none"
                    style={{ width: "100%", height: "100%" }}
                  >
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

          {/* ── Status bar / helper text ── */}
          <p className="text-xs text-center text-muted-foreground">
            {activeTool === "select" &&
              "Click to select elements. Double-click text to edit. Drag to move. Drag corners to resize."}
            {activeTool === "text" &&
              "Click anywhere on the page to place a text box. Start typing immediately."}
            {activeTool === "whiteout" &&
              "Click and drag to draw a whiteout rectangle over content you want to hide."}
            {activeTool === "draw" &&
              "Click and drag to draw freehand lines on the page."}
            {activeTool === "image" &&
              "Select an image file to place on the page."}
          </p>

          {/* ── Upload different PDF button ── */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (editingText) commitTextBox(editingText);
                setFiles([]);
                setPageImages([]);
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
