"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Pencil, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { Toolbar, ShapeSubToolbar, HowItWorksTooltip } from "@/components/pdf-editor/toolbar";
import { Thumbnails } from "@/components/pdf-editor/thumbnails";
import { PropertiesPanel } from "@/components/pdf-editor/properties-panel";
import { downloadPDF, cn } from "@/lib/utils";
import { ToolSEOContent } from "@/components/seo/tool-seo-content";
import { motion, AnimatePresence } from "framer-motion";

import type {
  OverlayElement,
  AddedTextElement,
  WhiteoutElement,
  ImageElement,
  DrawElement,
  HighlightElement,
  ShapeElement,
  PageData,
  EditorTool,
} from "@/lib/pdf-editor/types";
import { RENDER_SCALE } from "@/lib/pdf-editor/types";
import {
  processPage,
  hitTestTextBlock,
  preciseAutoFit,
  saveEditorState,
  clearEditorState,
} from "@/lib/pdf-editor/engine";
import { exportEditedPDF, validateExport } from "@/lib/pdf-editor/export";

// ─── Undo snapshot ───
interface Snapshot {
  textBlockEdits: Array<[string, { text: string; isEdited: boolean; fontSize: number; letterSpacing: number }]>;
  overlayElements: OverlayElement[];
}

function takeSnapshot(pages: PageData[], overlays: OverlayElement[]): Snapshot {
  const edits: Snapshot["textBlockEdits"] = [];
  for (const page of pages) {
    for (const block of page.textBlocks) {
      if (block.isEdited) {
        edits.push([block.id, {
          text: block.editedText,
          isEdited: true,
          fontSize: block.adjustedFontSize,
          letterSpacing: block.adjustedLetterSpacing,
        }]);
      }
    }
  }
  return { textBlockEdits: edits, overlayElements: [...overlays] };
}

function applySnapshot(pages: PageData[], snapshot: Snapshot): PageData[] {
  const editMap = new Map(snapshot.textBlockEdits);
  return pages.map((page) => ({
    ...page,
    textBlocks: page.textBlocks.map((block) => {
      const edit = editMap.get(block.id);
      if (edit) {
        return {
          ...block,
          editedText: edit.text,
          isEdited: edit.isEdited,
          adjustedFontSize: edit.fontSize,
          adjustedLetterSpacing: edit.letterSpacing,
        };
      }
      return {
        ...block,
        editedText: block.text,
        isEdited: false,
        adjustedFontSize: block.screenFontSize,
        adjustedLetterSpacing: 0,
      };
    }),
  }));
}

// ─── Main Editor Component ───

export default function EditPDFPage() {
  // File state
  const [files, setFiles] = useState<File[]>([]);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Page data
  const [pages, setPages] = useState<PageData[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  // Editor state
  const [zoom, setZoom] = useState(1);
  const [activeTool, setActiveTool] = useState<EditorTool>("edit-text");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [precisionMode, setPrecisionMode] = useState(false);
  const [autoFitEnabled, setAutoFitEnabled] = useState(true);
  const [fitWarning, setFitWarning] = useState(false);

  // Overlay elements (non-text edits)
  const [overlayElements, setOverlayElements] = useState<OverlayElement[]>([]);

  // Undo/redo
  const [undoStack, setUndoStack] = useState<Snapshot[]>([]);
  const [redoStack, setRedoStack] = useState<Snapshot[]>([]);

  // Tool-specific state
  const [textColor, setTextColor] = useState("#000000");
  const [textFontSize, setTextFontSize] = useState(24);
  const [drawColor, setDrawColor] = useState("#000000");
  const [drawWidth, setDrawWidth] = useState(2);
  const [highlightColor, setHighlightColor] = useState("#ffeb3b");
  const [whiteoutColor, setWhiteoutColor] = useState("#ffffff");
  const [shapeType, setShapeType] = useState<"rectangle" | "ellipse" | "line">("rectangle");
  const [shapeStrokeColor] = useState("#000000");
  const [shapeFillColor] = useState("transparent");

  // Interaction state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDrawPoints, setCurrentDrawPoints] = useState<{ x: number; y: number }[] | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  // Export state
  const [exporting, setExporting] = useState(false);
  const [showScannedWarning, setShowScannedWarning] = useState(false);

  // Refs
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // ─── Derived state ───
  const currentPageData = pages[currentPage] || null;
  const currentTextBlocks = currentPageData?.textBlocks || [];
  const currentOverlays = overlayElements.filter((el) => el.pageIndex === currentPage);

  const selectedBlock = selectedBlockId
    ? currentTextBlocks.find((b) => b.id === selectedBlockId) || null
    : null;

  const hasEdits =
    pages.some((p) => p.textBlocks.some((b) => b.isEdited)) ||
    overlayElements.length > 0;

  // ─── Undo/Redo ───
  const pushUndo = useCallback(() => {
    const snap = takeSnapshot(pages, overlayElements);
    setUndoStack((prev) => [...prev.slice(-50), snap]);
    setRedoStack([]);
  }, [pages, overlayElements]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const currentSnap = takeSnapshot(pages, overlayElements);
    setRedoStack((prev) => [...prev, currentSnap]);
    const prevSnap = undoStack[undoStack.length - 1];
    setPages((p) => applySnapshot(p, prevSnap));
    setOverlayElements(prevSnap.overlayElements);
    setUndoStack((prev) => prev.slice(0, -1));
    setSelectedBlockId(null);
    setEditingBlockId(null);
    setSelectedOverlayId(null);
  }, [undoStack, pages, overlayElements]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const currentSnap = takeSnapshot(pages, overlayElements);
    setUndoStack((prev) => [...prev, currentSnap]);
    const nextSnap = redoStack[redoStack.length - 1];
    setPages((p) => applySnapshot(p, nextSnap));
    setOverlayElements(nextSnap.overlayElements);
    setRedoStack((prev) => prev.slice(0, -1));
    setSelectedBlockId(null);
    setEditingBlockId(null);
    setSelectedOverlayId(null);
  }, [redoStack, pages, overlayElements]);

  // ─── Delete selected ───
  const handleDeleteSelected = useCallback(() => {
    if (selectedOverlayId) {
      pushUndo();
      setOverlayElements((prev) => prev.filter((el) => el.id !== selectedOverlayId));
      setSelectedOverlayId(null);
    }
  }, [selectedOverlayId, pushUndo]);

  // ─── Zoom ───
  const handleZoomFit = useCallback(() => {
    if (!editorContainerRef.current || !currentPageData) return;
    const containerWidth = editorContainerRef.current.clientWidth - 40;
    const pageWidth = currentPageData.width;
    setZoom(Math.min(containerWidth / pageWidth, 2));
  }, [currentPageData]);

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingBlockId && (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        if (e.key === "Escape") {
          setEditingBlockId(null);
        }
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && e.shiftKey) {
          e.preventDefault();
          redo();
        } else if (e.key === "z") {
          e.preventDefault();
          undo();
        }
        return;
      }

      switch (e.key) {
        case "Escape":
          setEditingBlockId(null);
          setSelectedBlockId(null);
          setSelectedOverlayId(null);
          break;
        case "Delete":
        case "Backspace":
          if (selectedOverlayId && !editingBlockId) {
            e.preventDefault();
            handleDeleteSelected();
          }
          break;
        case "v":
        case "V":
          if (!editingBlockId) setActiveTool("select");
          break;
        case "t":
        case "T":
          if (!editingBlockId) setActiveTool("edit-text");
          break;
        case "h":
        case "H":
          if (!editingBlockId) setActiveTool("highlight");
          break;
        case "d":
        case "D":
          if (!editingBlockId) setActiveTool("draw");
          break;
        case "w":
        case "W":
          if (!editingBlockId) setActiveTool("whiteout");
          break;
        case "+":
        case "=":
          setZoom((z) => Math.min(3, z + 0.25));
          break;
        case "-":
          setZoom((z) => Math.max(0.25, z - 0.25));
          break;
        case "0":
          handleZoomFit();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingBlockId, selectedOverlayId, undo, redo, handleDeleteSelected, handleZoomFit]);

  // ─── Auto-save state periodically ───
  useEffect(() => {
    if (files.length === 0 || pages.length === 0) return;
    const timer = setInterval(() => {
      const editedBlocks = new Map<string, { text: string; fontSize: number; letterSpacing: number }>();
      for (const page of pages) {
        for (const block of page.textBlocks) {
          if (block.isEdited) {
            editedBlocks.set(block.id, {
              text: block.editedText,
              fontSize: block.adjustedFontSize,
              letterSpacing: block.adjustedLetterSpacing,
            });
          }
        }
      }
      saveEditorState(editedBlocks, overlayElements, files[0].name);
    }, 5000);
    return () => clearInterval(timer);
  }, [files, pages, overlayElements]);

  // ─── Load PDF ───
  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    setFiles(newFiles);
    resetEditor();

    if (newFiles.length > 0) {
      setProcessing(true);
      setProgress(5);

      try {
        const bytes = await newFiles[0].arrayBuffer();
        setPdfBytes(bytes);
        setProgress(10);

        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.mjs",
          import.meta.url
        ).toString();

        const pdf = await pdfjs.getDocument({ data: bytes }).promise;
        const loadedPages: PageData[] = [];
        let anyScanned = false;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const pageData = await processPage(page, i - 1, RENDER_SCALE);
          loadedPages.push(pageData);
          if (pageData.isScanned) anyScanned = true;
          setProgress(10 + Math.round((i / pdf.numPages) * 85));
        }

        setPages(loadedPages);
        setShowScannedWarning(anyScanned);
        setProgress(100);
      } catch (err) {
        console.error("Failed to load PDF:", err);
        alert("Failed to load PDF. The file may be corrupted or password-protected.");
      } finally {
        setProcessing(false);
      }
    }
  }, []);

  function resetEditor() {
    setPages([]);
    setCurrentPage(0);
    setOverlayElements([]);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedBlockId(null);
    setEditingBlockId(null);
    setSelectedOverlayId(null);
    setActiveTool("edit-text");
    setZoom(1);
    setFitWarning(false);
    clearEditorState();
  }

  // ─── Mouse position helper ───
  const getRelativePos = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  };

  // ─── Hit test overlay elements ───
  function hitTestOverlay(overlays: OverlayElement[], pos: { x: number; y: number }): OverlayElement | null {
    for (let i = overlays.length - 1; i >= 0; i--) {
      const el = overlays[i];
      if (el.type === "draw") {
        for (const pt of el.points) {
          if (Math.sqrt((pos.x - pt.x) ** 2 + (pos.y - pt.y) ** 2) < 10) return el;
        }
      } else if ("x" in el && "width" in el) {
        const r = el as unknown as { x: number; y: number; width: number; height: number };
        if (pos.x >= r.x && pos.x <= r.x + r.width && pos.y >= r.y && pos.y <= r.y + r.height) {
          return el;
        }
      }
    }
    return null;
  }

  // ─── Canvas mouse handlers ───
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const pos = getRelativePos(e);

    if (activeTool === "edit-text" || activeTool === "select") {
      const block = hitTestTextBlock(currentTextBlocks, pos.x, pos.y);
      if (block) {
        setSelectedBlockId(block.id);
        setSelectedOverlayId(null);
        return;
      }

      const overlay = hitTestOverlay(currentOverlays, pos);
      if (overlay) {
        setSelectedOverlayId(overlay.id);
        setSelectedBlockId(null);
        setEditingBlockId(null);
        if (overlay.type !== "draw") {
          const r = overlay as unknown as { x: number; y: number };
          setDragOffset({ x: pos.x - r.x, y: pos.y - r.y });
        }
        return;
      }

      setSelectedBlockId(null);
      setEditingBlockId(null);
      setSelectedOverlayId(null);
      return;
    }

    if (activeTool === "add-text") {
      pushUndo();
      const newEl: AddedTextElement = {
        type: "added-text",
        id: `at-${Date.now()}`,
        pageIndex: currentPage,
        x: pos.x,
        y: pos.y,
        text: "Text",
        fontSize: textFontSize,
        fontFamily: "Arial",
        color: textColor,
        bold: false,
        italic: false,
      };
      setOverlayElements((prev) => [...prev, newEl]);
      setSelectedOverlayId(newEl.id);
      setActiveTool("select");
      return;
    }

    if (activeTool === "whiteout" || activeTool === "highlight" || activeTool === "shape") {
      setIsDrawing(true);
      setDrawStart(pos);
      return;
    }

    if (activeTool === "draw") {
      setIsDrawing(true);
      setCurrentDrawPoints([pos]);
      return;
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const pos = getRelativePos(e);

    if ((activeTool === "select") && selectedOverlayId && dragOffset && !editingBlockId) {
      setOverlayElements((prev) =>
        prev.map((el) => {
          if (el.id !== selectedOverlayId) return el;
          if (el.type === "draw") return el;
          return { ...el, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y } as OverlayElement;
        })
      );
      return;
    }

    if (isDrawing) {
      if (activeTool === "draw" && currentDrawPoints) {
        setCurrentDrawPoints((prev) => [...(prev || []), pos]);
      } else if (drawStart) {
        setCurrentDrawPoints([drawStart, pos]);
      }
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const pos = getRelativePos(e);

    if (dragOffset) {
      if (selectedOverlayId) pushUndo();
      setDragOffset(null);
    }

    if (!isDrawing) return;

    if (activeTool === "whiteout" && drawStart) {
      const x = Math.min(drawStart.x, pos.x);
      const y = Math.min(drawStart.y, pos.y);
      const w = Math.abs(pos.x - drawStart.x);
      const h = Math.abs(pos.y - drawStart.y);
      if (w > 3 && h > 3) {
        pushUndo();
        const newEl: WhiteoutElement = {
          type: "whiteout",
          id: `wo-${Date.now()}`,
          pageIndex: currentPage,
          x, y, width: w, height: h,
          color: whiteoutColor,
        };
        setOverlayElements((prev) => [...prev, newEl]);
      }
    }

    if (activeTool === "highlight" && drawStart) {
      const x = Math.min(drawStart.x, pos.x);
      const y = Math.min(drawStart.y, pos.y);
      const w = Math.abs(pos.x - drawStart.x);
      const h = Math.abs(pos.y - drawStart.y);
      if (w > 3 && h > 3) {
        pushUndo();
        const newEl: HighlightElement = {
          type: "highlight",
          id: `hl-${Date.now()}`,
          pageIndex: currentPage,
          x, y, width: w, height: h,
          color: highlightColor,
          opacity: 0.35,
        };
        setOverlayElements((prev) => [...prev, newEl]);
      }
    }

    if (activeTool === "draw" && currentDrawPoints && currentDrawPoints.length > 1) {
      pushUndo();
      const newEl: DrawElement = {
        type: "draw",
        id: `dr-${Date.now()}`,
        pageIndex: currentPage,
        points: currentDrawPoints,
        color: drawColor,
        lineWidth: drawWidth,
      };
      setOverlayElements((prev) => [...prev, newEl]);
    }

    if (activeTool === "shape" && drawStart) {
      const x = Math.min(drawStart.x, pos.x);
      const y = Math.min(drawStart.y, pos.y);
      const w = Math.abs(pos.x - drawStart.x);
      const h = Math.abs(pos.y - drawStart.y);
      if (w > 3 || h > 3) {
        pushUndo();
        const newEl: ShapeElement = {
          type: "shape",
          id: `sh-${Date.now()}`,
          pageIndex: currentPage,
          x, y, width: w, height: h,
          shapeType: shapeType,
          strokeColor: shapeStrokeColor,
          fillColor: shapeFillColor,
          strokeWidth: 2,
        };
        setOverlayElements((prev) => [...prev, newEl]);
      }
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentDrawPoints(null);
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== "edit-text" && activeTool !== "select") return;
    const pos = getRelativePos(e);
    const block = hitTestTextBlock(currentTextBlocks, pos.x, pos.y);
    if (block) {
      setSelectedBlockId(block.id);
      setEditingBlockId(block.id);
      setSelectedOverlayId(null);
      setTimeout(() => editInputRef.current?.focus(), 50);
    }
  };

  // ─── Text editing ───
  const handleTextEdit = (blockId: string, newText: string) => {
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        textBlocks: page.textBlocks.map((block) => {
          if (block.id !== blockId) return block;
          const updated = { ...block, editedText: newText, isEdited: newText !== block.text };

          if (autoFitEnabled && newText !== block.text) {
            const fit = preciseAutoFit(block, newText);
            updated.adjustedFontSize = fit.fontSize;
            updated.adjustedLetterSpacing = fit.letterSpacing;
            setFitWarning(!fit.fits);
          } else if (newText === block.text) {
            updated.adjustedFontSize = block.screenFontSize;
            updated.adjustedLetterSpacing = 0;
            setFitWarning(false);
          }
          return updated;
        }),
      }))
    );
  };

  const handleTextEditCommit = () => {
    pushUndo();
    setEditingBlockId(null);
  };

  // ─── Image upload ───
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        pushUndo();
        const maxW = 300;
        const ratio = img.width / img.height;
        const w = Math.min(img.width, maxW);
        const h = w / ratio;
        const newEl: ImageElement = {
          type: "image",
          id: `img-${Date.now()}`,
          pageIndex: currentPage,
          x: 50, y: 50,
          width: w, height: h,
          dataUrl: reader.result as string,
        };
        setOverlayElements((prev) => [...prev, newEl]);
        setSelectedOverlayId(newEl.id);
        setActiveTool("select");
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ─── Export ───
  const handleExport = async () => {
    if (!pdfBytes) return;
    setExporting(true);
    setProcessing(true);
    setProgress(0);

    try {
      const result = await exportEditedPDF(
        pdfBytes,
        pages,
        overlayElements,
        "standard",
        (pct) => setProgress(pct)
      );

      const validation = await validateExport(result, pages.length);
      if (!validation.valid) {
        console.warn("Export validation warning:", validation.error);
      }

      downloadPDF(result, files[0]?.name?.replace(".pdf", "-edited.pdf") || "edited.pdf");
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExporting(false);
      setProcessing(false);
    }
  };

  // ─── Page management ───
  const handlePageDelete = (idx: number) => {
    if (pages.length <= 1) return;
    pushUndo();
    setPages((prev) => prev.filter((_, i) => i !== idx));
    setOverlayElements((prev) => prev.filter((el) => el.pageIndex !== idx));
    if (currentPage >= pages.length - 1) setCurrentPage(Math.max(0, currentPage - 1));
  };

  const handlePageDuplicate = (idx: number) => {
    const source = pages[idx];
    if (!source) return;
    pushUndo();
    const newPage: PageData = {
      ...source,
      pageIndex: pages.length,
      textBlocks: source.textBlocks.map((b) => ({ ...b, pageIndex: pages.length, id: `${b.id}-dup` })),
    };
    setPages((prev) => [...prev.slice(0, idx + 1), newPage, ...prev.slice(idx + 1)]);
  };

  const handlePageReorder = (from: number, to: number) => {
    pushUndo();
    setPages((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr.map((p, i) => ({ ...p, pageIndex: i }));
    });
  };

  // ─── Properties panel callbacks ───
  const handleBlockFontSizeChange = (size: number) => {
    if (!selectedBlockId) return;
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        textBlocks: page.textBlocks.map((b) =>
          b.id === selectedBlockId ? { ...b, adjustedFontSize: size } : b
        ),
      }))
    );
  };

  const handleBlockColorChange = (color: string) => {
    if (!selectedBlockId) return;
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        textBlocks: page.textBlocks.map((b) =>
          b.id === selectedBlockId ? { ...b, color } : b
        ),
      }))
    );
  };

  const handleBlockLetterSpacingChange = (spacing: number) => {
    if (!selectedBlockId) return;
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        textBlocks: page.textBlocks.map((b) =>
          b.id === selectedBlockId ? { ...b, adjustedLetterSpacing: spacing } : b
        ),
      }))
    );
  };

  const handleBlockOpacityChange = (opacity: number) => {
    if (!selectedBlockId) return;
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        textBlocks: page.textBlocks.map((b) =>
          b.id === selectedBlockId ? { ...b, opacity } : b
        ),
      }))
    );
  };

  const handleBlockBgColorChange = (color: string) => {
    if (!selectedBlockId) return;
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        textBlocks: page.textBlocks.map((b) =>
          b.id === selectedBlockId ? { ...b, backgroundColor: color } : b
        ),
      }))
    );
  };

  const handleResetBlock = () => {
    if (!selectedBlockId) return;
    pushUndo();
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        textBlocks: page.textBlocks.map((b) =>
          b.id === selectedBlockId
            ? {
                ...b,
                editedText: b.text,
                isEdited: false,
                adjustedFontSize: b.screenFontSize,
                adjustedLetterSpacing: 0,
              }
            : b
        ),
      }))
    );
    setFitWarning(false);
    setEditingBlockId(null);
  };

  // ─── Get cursor ───
  function getCursor(): string {
    switch (activeTool) {
      case "edit-text": return "text";
      case "add-text": return "text";
      case "whiteout": return "crosshair";
      case "highlight": return "crosshair";
      case "draw": return "crosshair";
      case "shape": return "crosshair";
      default: return "default";
    }
  }

  // ─── Render ───
  return (
    <ToolLayout
      title="Edit PDF"
      description="Edit existing text in place with perfect font matching. Privacy-first, browser-only."
      icon={Pencil}
      color="from-sky-500 to-blue-600"
      processing={processing}
      progress={progress}
    >
      {pages.length === 0 ? (
        <div className="space-y-4">
          <FileUpload
            accept=".pdf"
            onFilesSelected={handleFilesSelected}
            files={files}
            onRemoveFile={() => {
              setFiles([]);
              resetEditor();
            }}
            label="Upload PDF to edit"
            description="Drop a PDF file here to start editing. Click any text to edit it in place."
          />
          <HowItWorksTooltip />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Scanned PDF warning */}
          <AnimatePresence>
            {showScannedWarning && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5"
              >
                <ScanLine className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Scanned PDF Detected
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Some pages appear to be scanned images. Text editing requires selectable text.
                    Use Annotate mode (Add Text, Whiteout, Draw) to modify these pages,
                    or try a PDF with selectable text for in-place editing.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs"
                  onClick={() => setShowScannedWarning(false)}
                >
                  Dismiss
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toolbar */}
          <Toolbar
            activeTool={activeTool}
            onToolChange={(tool) => {
              setActiveTool(tool);
              setEditingBlockId(null);
            }}
            onUndo={undo}
            onRedo={redo}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
            onDelete={handleDeleteSelected}
            canDelete={!!selectedOverlayId}
            zoom={zoom}
            onZoomIn={() => setZoom((z) => Math.min(3, z + 0.25))}
            onZoomOut={() => setZoom((z) => Math.max(0.25, z - 0.25))}
            onZoomFit={handleZoomFit}
            onExport={handleExport}
            exporting={exporting}
            precisionMode={precisionMode}
            onPrecisionToggle={() => setPrecisionMode((v) => !v)}
            onImageUpload={() => imageInputRef.current?.click()}
            hasEdits={hasEdits}
          />

          {/* Shape sub-toolbar */}
          {activeTool === "shape" && (
            <ShapeSubToolbar
              activeShape={shapeType}
              onShapeChange={setShapeType}
            />
          )}

          {/* Tool-specific options bar */}
          {(activeTool === "draw" || activeTool === "highlight" || activeTool === "whiteout" || activeTool === "add-text") && (
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg border border-border bg-card/50 text-xs">
              {(activeTool === "draw" || activeTool === "add-text") && (
                <>
                  <label className="text-muted-foreground">Color:</label>
                  <Input
                    type="color"
                    value={activeTool === "draw" ? drawColor : textColor}
                    onChange={(e) => activeTool === "draw" ? setDrawColor(e.target.value) : setTextColor(e.target.value)}
                    className="h-7 w-7 p-0.5 rounded cursor-pointer"
                  />
                </>
              )}
              {activeTool === "draw" && (
                <>
                  <label className="text-muted-foreground">Width:</label>
                  <Input
                    type="number"
                    value={drawWidth}
                    onChange={(e) => setDrawWidth(parseInt(e.target.value) || 2)}
                    className="h-7 w-12 text-xs"
                    min={1}
                    max={20}
                  />
                </>
              )}
              {activeTool === "add-text" && (
                <>
                  <label className="text-muted-foreground">Size:</label>
                  <Input
                    type="number"
                    value={textFontSize}
                    onChange={(e) => setTextFontSize(parseInt(e.target.value) || 16)}
                    className="h-7 w-14 text-xs"
                    min={8}
                    max={120}
                  />
                </>
              )}
              {activeTool === "highlight" && (
                <>
                  <label className="text-muted-foreground">Color:</label>
                  <Input
                    type="color"
                    value={highlightColor}
                    onChange={(e) => setHighlightColor(e.target.value)}
                    className="h-7 w-7 p-0.5 rounded cursor-pointer"
                  />
                </>
              )}
              {activeTool === "whiteout" && (
                <>
                  <label className="text-muted-foreground">Fill:</label>
                  <Input
                    type="color"
                    value={whiteoutColor}
                    onChange={(e) => setWhiteoutColor(e.target.value)}
                    className="h-7 w-7 p-0.5 rounded cursor-pointer"
                  />
                </>
              )}
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Main editor layout: thumbnails | canvas | properties */}
          <div className="flex gap-3" ref={editorContainerRef}>
            {/* Left: Page thumbnails */}
            <div className="hidden md:block w-24 shrink-0">
              <Thumbnails
                pages={pages}
                currentPage={currentPage}
                onPageSelect={setCurrentPage}
                onPageRotate={() => {}}
                onPageDelete={handlePageDelete}
                onPageDuplicate={handlePageDuplicate}
                onPageReorder={handlePageReorder}
              />
            </div>

            {/* Center: Canvas area */}
            <div className="flex-1 min-w-0">
              {/* Mobile page nav */}
              <div className="flex items-center justify-center gap-3 mb-2 md:hidden">
                <Button
                  variant="ghost" size="sm"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                >
                  Prev
                </Button>
                <span className="text-xs">Page {currentPage + 1} / {pages.length}</span>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
                  disabled={currentPage === pages.length - 1}
                >
                  Next
                </Button>
              </div>

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
                    cursor: getCursor(),
                  }}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onDoubleClick={handleCanvasDoubleClick}
                  onMouseLeave={() => {
                    if (isDrawing) {
                      setIsDrawing(false);
                      setDrawStart(null);
                      setCurrentDrawPoints(null);
                    }
                  }}
                >
                  {/* Layer A: PDF page image */}
                  {currentPageData && (
                    <img
                      src={currentPageData.imageDataUrl}
                      alt={`Page ${currentPage + 1}`}
                      className="block select-none pointer-events-none"
                      draggable={false}
                      style={{
                        width: currentPageData.width,
                        height: currentPageData.height,
                      }}
                    />
                  )}

                  {/* Layer B: Text block overlays */}
                  {currentTextBlocks.map((block) => {
                    const isSelected = selectedBlockId === block.id;
                    const isEditing = editingBlockId === block.id;

                    return (
                      <div
                        key={block.id}
                        className={cn(
                          "absolute transition-colors duration-75",
                          (activeTool === "edit-text" || activeTool === "select") && !isEditing &&
                            "hover:outline hover:outline-1 hover:outline-primary/40 hover:bg-primary/5",
                          isSelected && !isEditing &&
                            "outline outline-2 outline-primary/60 bg-primary/5",
                          precisionMode &&
                            "outline outline-1 outline-dashed outline-amber-500/40",
                        )}
                        style={{
                          left: block.screenX - 1,
                          top: block.screenY - 1,
                          width: block.screenWidth + 2,
                          height: block.screenHeight + 2,
                          backgroundColor:
                            block.isEdited || isEditing
                              ? block.backgroundColor
                              : "transparent",
                          transform:
                            block.rotation !== 0
                              ? `rotate(${block.rotation}deg)`
                              : undefined,
                          transformOrigin: "left bottom",
                        }}
                      >
                        {/* Precision mode: baseline indicator */}
                        {precisionMode && (
                          <div
                            className="absolute left-0 right-0 border-b border-dashed border-red-400/50 pointer-events-none"
                            style={{
                              top: block.screenBaseline - block.screenY,
                            }}
                          />
                        )}

                        {isEditing ? (
                          <input
                            ref={editInputRef}
                            autoFocus
                            value={block.editedText}
                            onChange={(e) => handleTextEdit(block.id, e.target.value)}
                            onBlur={() => handleTextEditCommit()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleTextEditCommit();
                              if (e.key === "Escape") setEditingBlockId(null);
                              e.stopPropagation();
                            }}
                            className="w-full h-full bg-transparent border-none outline-none p-0 m-0"
                            style={{
                              color: block.color,
                              fontSize: block.adjustedFontSize,
                              fontFamily: block.fontFamily,
                              fontWeight: block.fontWeight,
                              fontStyle: block.fontStyle,
                              letterSpacing: block.adjustedLetterSpacing,
                              opacity: block.opacity,
                              lineHeight: 1,
                              paddingTop:
                                block.screenBaseline - block.screenY - block.adjustedFontSize * 0.85,
                              paddingLeft: 1,
                              caretColor: block.color,
                            }}
                          />
                        ) : block.isEdited ? (
                          <span
                            className="block select-none whitespace-nowrap overflow-hidden"
                            style={{
                              color: block.color,
                              fontSize: block.adjustedFontSize,
                              fontFamily: block.fontFamily,
                              fontWeight: block.fontWeight,
                              fontStyle: block.fontStyle,
                              letterSpacing: block.adjustedLetterSpacing,
                              opacity: block.opacity,
                              lineHeight: 1,
                              paddingTop:
                                block.screenBaseline - block.screenY - block.adjustedFontSize * 0.85,
                              paddingLeft: 1,
                            }}
                          >
                            {block.editedText}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}

                  {/* Overlay elements */}
                  {currentOverlays.map((el) => {
                    const isSelected = selectedOverlayId === el.id;

                    if (el.type === "whiteout") {
                      return (
                        <div
                          key={el.id}
                          className={cn("absolute", isSelected && "ring-2 ring-primary ring-offset-1")}
                          style={{
                            left: el.x, top: el.y,
                            width: el.width, height: el.height,
                            backgroundColor: el.color,
                          }}
                        />
                      );
                    }

                    if (el.type === "highlight") {
                      return (
                        <div
                          key={el.id}
                          className={cn("absolute", isSelected && "ring-2 ring-primary ring-offset-1")}
                          style={{
                            left: el.x, top: el.y,
                            width: el.width, height: el.height,
                            backgroundColor: el.color,
                            opacity: el.opacity,
                            mixBlendMode: "multiply",
                          }}
                        />
                      );
                    }

                    if (el.type === "added-text") {
                      return (
                        <div
                          key={el.id}
                          className={cn("absolute", isSelected && "ring-2 ring-primary ring-offset-1 rounded")}
                          style={{
                            left: el.x,
                            top: el.y - el.fontSize * 1.2,
                            cursor: activeTool === "select" ? "move" : "default",
                          }}
                        >
                          <span
                            style={{
                              color: el.color,
                              fontSize: el.fontSize,
                              fontWeight: el.bold ? "bold" : "normal",
                              fontStyle: el.italic ? "italic" : "normal",
                              fontFamily: el.fontFamily,
                              whiteSpace: "nowrap",
                              userSelect: "none",
                            }}
                          >
                            {el.text}
                          </span>
                        </div>
                      );
                    }

                    if (el.type === "image") {
                      return (
                        <div
                          key={el.id}
                          className={cn("absolute", isSelected && "ring-2 ring-primary ring-offset-1")}
                          style={{
                            left: el.x, top: el.y,
                            width: el.width, height: el.height,
                          }}
                        >
                          <img
                            src={el.dataUrl}
                            alt="Placed image"
                            className="w-full h-full object-contain pointer-events-none"
                            draggable={false}
                          />
                        </div>
                      );
                    }

                    if (el.type === "draw") {
                      return (
                        <svg
                          key={el.id}
                          className={cn(
                            "absolute inset-0 pointer-events-none",
                            isSelected && "drop-shadow-[0_0_3px_rgba(59,130,246,0.8)]"
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

                    if (el.type === "shape") {
                      return (
                        <svg
                          key={el.id}
                          className={cn(
                            "absolute inset-0 pointer-events-none",
                            isSelected && "drop-shadow-[0_0_3px_rgba(59,130,246,0.8)]"
                          )}
                          style={{ width: "100%", height: "100%" }}
                        >
                          {el.shapeType === "rectangle" && (
                            <rect
                              x={el.x} y={el.y}
                              width={el.width} height={el.height}
                              stroke={el.strokeColor}
                              strokeWidth={el.strokeWidth}
                              fill={el.fillColor === "transparent" ? "none" : el.fillColor}
                              fillOpacity={el.fillColor === "transparent" ? 0 : 0.3}
                            />
                          )}
                          {el.shapeType === "ellipse" && (
                            <ellipse
                              cx={el.x + el.width / 2}
                              cy={el.y + el.height / 2}
                              rx={el.width / 2}
                              ry={el.height / 2}
                              stroke={el.strokeColor}
                              strokeWidth={el.strokeWidth}
                              fill={el.fillColor === "transparent" ? "none" : el.fillColor}
                              fillOpacity={el.fillColor === "transparent" ? 0 : 0.3}
                            />
                          )}
                          {el.shapeType === "line" && (
                            <line
                              x1={el.x} y1={el.y}
                              x2={el.x + el.width} y2={el.y + el.height}
                              stroke={el.strokeColor}
                              strokeWidth={el.strokeWidth}
                            />
                          )}
                        </svg>
                      );
                    }

                    return null;
                  })}

                  {/* Drawing preview */}
                  {isDrawing && currentDrawPoints && currentDrawPoints.length > 1 && (
                    <>
                      {activeTool === "draw" && (
                        <svg
                          className="absolute inset-0 pointer-events-none"
                          style={{ width: "100%", height: "100%" }}
                        >
                          <polyline
                            points={currentDrawPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                            fill="none"
                            stroke={drawColor}
                            strokeWidth={drawWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={0.6}
                          />
                        </svg>
                      )}
                      {(activeTool === "whiteout" || activeTool === "highlight" || activeTool === "shape") && (
                        <div
                          className="absolute border-2 border-dashed border-primary/50 pointer-events-none"
                          style={{
                            left: Math.min(currentDrawPoints[0].x, currentDrawPoints[1].x),
                            top: Math.min(currentDrawPoints[0].y, currentDrawPoints[1].y),
                            width: Math.abs(currentDrawPoints[1].x - currentDrawPoints[0].x),
                            height: Math.abs(currentDrawPoints[1].y - currentDrawPoints[0].y),
                            backgroundColor:
                              activeTool === "whiteout"
                                ? `${whiteoutColor}80`
                                : activeTool === "highlight"
                                ? `${highlightColor}40`
                                : "transparent",
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Status tips */}
              <p className="text-xs text-center text-muted-foreground mt-2">
                {activeTool === "edit-text" &&
                  "Click a text block to select it. Double-click to edit in place. Esc to exit."}
                {activeTool === "select" &&
                  "Click to select elements. Drag to move. Double-click text to edit."}
                {activeTool === "add-text" && "Click anywhere to place new text."}
                {activeTool === "highlight" && "Click and drag to highlight an area."}
                {activeTool === "draw" && "Click and drag to draw freehand."}
                {activeTool === "shape" && "Click and drag to draw a shape."}
                {activeTool === "whiteout" &&
                  "Click and drag to cover an area with a solid fill."}
                {activeTool === "image" && "Select an image file to place on the page."}
              </p>
            </div>

            {/* Right: Properties panel */}
            <div
              className="hidden lg:block w-56 shrink-0 border border-border rounded-xl bg-card overflow-y-auto"
              style={{ maxHeight: "75vh" }}
            >
              <PropertiesPanel
                selectedBlock={selectedBlock}
                autoFitEnabled={autoFitEnabled}
                onAutoFitToggle={setAutoFitEnabled}
                onFontSizeChange={handleBlockFontSizeChange}
                onColorChange={handleBlockColorChange}
                onLetterSpacingChange={handleBlockLetterSpacingChange}
                onOpacityChange={handleBlockOpacityChange}
                onBackgroundColorChange={handleBlockBgColorChange}
                onResetBlock={handleResetBlock}
                fitWarning={fitWarning}
              />
            </div>
          </div>

          {/* Upload different file */}
          <div className="flex justify-center gap-3 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFiles([]);
                setPdfBytes(null);
                resetEditor();
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
