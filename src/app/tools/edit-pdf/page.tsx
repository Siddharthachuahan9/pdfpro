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
  Palette,
  Trash2,
  Move,
  MousePointer,
  Bold,
  Italic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { downloadPDF } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type EditTool = "select" | "text" | "whiteout" | "image" | "draw";

interface TextElement {
  type: "text";
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
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

export default function EditPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [activeTool, setActiveTool] = useState<EditTool>("select");
  const [elements, setElements] = useState<EditElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<EditElement[][]>([]);
  const [redoStack, setRedoStack] = useState<EditElement[][]>([]);

  // Text tool state
  const [textColor, setTextColor] = useState("#000000");
  const [textFontSize, setTextFontSize] = useState(16);
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);

  // Whiteout color
  const [whiteoutColor, setWhiteoutColor] = useState("#ffffff");

  // Draw state
  const [drawColor, setDrawColor] = useState("#000000");
  const [drawWidth, setDrawWidth] = useState(2);

  // Interaction state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDraw, setCurrentDraw] = useState<{ x: number; y: number }[] | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  // Editing text
  const [editingText, setEditingText] = useState<string | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Original PDF data for export
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);

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
  }, [undoStack, elements]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, [...elements]]);
    setElements(next);
    setRedoStack((r) => r.slice(0, -1));
    setSelectedElement(null);
  }, [redoStack, elements]);

  // Load PDF and render pages
  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    setFiles(newFiles);
    setElements([]);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedElement(null);
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
          } as any) ).promise;

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

  const getRelativePos = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const pos = getRelativePos(e);

    if (activeTool === "select") {
      // Check if clicking on an existing element
      const pageElements = elements.filter((el) => el.page === currentPage);
      let found = false;

      for (let i = pageElements.length - 1; i >= 0; i--) {
        const el = pageElements[i];
        if (isPointInElement(pos, el)) {
          setSelectedElement(el.id);
          if (el.type === "draw") {
            const minX = Math.min(...el.points.map((p) => p.x));
            const minY = Math.min(...el.points.map((p) => p.y));
            setDragOffset({ x: pos.x - minX, y: pos.y - minY });
          } else {
            setDragOffset({ x: pos.x - el.x, y: pos.y - el.y });
          }
          found = true;
          break;
        }
      }

      if (!found) {
        setSelectedElement(null);
        setEditingText(null);
      }
      return;
    }

    if (activeTool === "text") {
      pushUndo();
      const newEl: TextElement = {
        type: "text",
        id: `text-${Date.now()}`,
        x: pos.x,
        y: pos.y,
        text: "Edit text",
        fontSize: textFontSize,
        fontFamily: "Arial",
        color: textColor,
        bold: textBold,
        italic: textItalic,
        page: currentPage,
      };
      setElements((prev) => [...prev, newEl]);
      setSelectedElement(newEl.id);
      setEditingText(newEl.id);
      setActiveTool("select");
      return;
    }

    if (activeTool === "whiteout") {
      setIsDrawing(true);
      setDrawStart(pos);
      return;
    }

    if (activeTool === "draw") {
      setIsDrawing(true);
      setCurrentDraw([pos]);
      return;
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const pos = getRelativePos(e);

    if (activeTool === "select" && selectedElement && dragOffset && !editingText) {
      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== selectedElement) return el;
          if (el.type === "draw") {
            const minX = Math.min(...el.points.map((p) => p.x));
            const minY = Math.min(...el.points.map((p) => p.y));
            const dx = pos.x - dragOffset.x - minX;
            const dy = pos.y - dragOffset.y - minY;
            return { ...el, points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
          }
          return { ...el, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
        })
      );
      return;
    }

    if (activeTool === "whiteout" && isDrawing && drawStart) {
      // Show preview via temp state - handled in render
      setCurrentDraw([drawStart, pos]);
      return;
    }

    if (activeTool === "draw" && isDrawing && currentDraw) {
      setCurrentDraw((prev) => [...(prev || []), pos]);
      return;
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const pos = getRelativePos(e);

    if (activeTool === "select" && dragOffset) {
      pushUndo();
      setDragOffset(null);
      return;
    }

    if (activeTool === "whiteout" && isDrawing && drawStart) {
      pushUndo();
      const x = Math.min(drawStart.x, pos.x);
      const y = Math.min(drawStart.y, pos.y);
      const w = Math.abs(pos.x - drawStart.x);
      const h = Math.abs(pos.y - drawStart.y);

      if (w > 5 && h > 5) {
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
    setDragOffset(null);
  };

  const isPointInElement = (pos: { x: number; y: number }, el: EditElement): boolean => {
    if (el.type === "text") {
      const w = el.text.length * el.fontSize * 0.6;
      const h = el.fontSize * 1.4;
      return pos.x >= el.x && pos.x <= el.x + w && pos.y >= el.y - h && pos.y <= el.y;
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

  const deleteSelected = () => {
    if (!selectedElement) return;
    pushUndo();
    setElements((prev) => prev.filter((el) => el.id !== selectedElement));
    setSelectedElement(null);
    setEditingText(null);
  };

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

  // Export edited PDF
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

      // We rendered at scale=2, so divide coordinates by 2 to match PDF space
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

          if (el.type === "text") {
            const hex = el.color;
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;

            let selectedFont = font;
            if (el.bold && el.italic) selectedFont = fontBoldItalic;
            else if (el.bold) selectedFont = fontBold;
            else if (el.italic) selectedFont = fontItalic;

            page.drawText(el.text, {
              x: el.x / scale,
              y: height - el.y / scale,
              size: el.fontSize / scale,
              font: selectedFont,
              color: rgb(r, g, b),
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

  const currentPageElements = elements.filter((el) => el.page === currentPage);

  const tools: { id: EditTool; icon: typeof Pencil; label: string }[] = [
    { id: "select", icon: MousePointer, label: "Select" },
    { id: "text", icon: Type, label: "Add Text" },
    { id: "whiteout", icon: Square, label: "Whiteout" },
    { id: "draw", icon: Pencil, label: "Draw" },
    { id: "image", icon: ImagePlus, label: "Image" },
  ];

  return (
    <ToolLayout
      title="Edit PDF"
      description="Edit text, add content, whiteout and modify any PDF"
      icon={Pencil}
      color="from-sky-500 to-blue-600"
      processing={processing}
      progress={progress}
    >
      {pageImages.length === 0 ? (
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
      ) : (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl border border-border bg-card">
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
                      setActiveTool(tool.id);
                      setEditingText(null);
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

            {/* Text formatting (when text tool or text selected) */}
            {(activeTool === "text" || (selectedElement && elements.find((e) => e.id === selectedElement)?.type === "text")) && (
              <div className="flex items-center gap-1 border-r border-border pr-2">
                <Input
                  type="color"
                  value={textColor}
                  onChange={(e) => {
                    setTextColor(e.target.value);
                    if (selectedElement) {
                      setElements((prev) =>
                        prev.map((el) =>
                          el.id === selectedElement && el.type === "text"
                            ? { ...el, color: e.target.value }
                            : el
                        )
                      );
                    }
                  }}
                  className="h-8 w-8 p-0.5 rounded cursor-pointer"
                  title="Text color"
                />
                <Input
                  type="number"
                  value={textFontSize}
                  onChange={(e) => {
                    const v = parseInt(e.target.value) || 16;
                    setTextFontSize(v);
                    if (selectedElement) {
                      setElements((prev) =>
                        prev.map((el) =>
                          el.id === selectedElement && el.type === "text"
                            ? { ...el, fontSize: v }
                            : el
                        )
                      );
                    }
                  }}
                  className="h-8 w-14 text-xs"
                  min={8}
                  max={72}
                  title="Font size"
                />
                <Button
                  variant={textBold ? "default" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setTextBold(!textBold);
                    if (selectedElement) {
                      setElements((prev) =>
                        prev.map((el) =>
                          el.id === selectedElement && el.type === "text"
                            ? { ...el, bold: !textBold }
                            : el
                        )
                      );
                    }
                  }}
                >
                  <Bold className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={textItalic ? "default" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setTextItalic(!textItalic);
                    if (selectedElement) {
                      setElements((prev) =>
                        prev.map((el) =>
                          el.id === selectedElement && el.type === "text"
                            ? { ...el, italic: !textItalic }
                            : el
                        )
                      );
                    }
                  }}
                >
                  <Italic className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

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

            {/* Undo/Redo/Delete */}
            <div className="flex items-center gap-1 border-r border-border pr-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={undo} disabled={undoStack.length === 0} title="Undo">
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={redo} disabled={redoStack.length === 0} title="Redo">
                <Redo2 className="h-3.5 w-3.5" />
              </Button>
              {selectedElement && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={deleteSelected} title="Delete">
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
            <Button onClick={handleExport} size="sm" className="h-8 gap-1.5 ml-auto" disabled={processing}>
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
            </Button>
          </div>

          {/* Page navigation */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
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
              onClick={() => setCurrentPage(Math.min(pageImages.length - 1, currentPage + 1))}
              disabled={currentPage === pageImages.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Canvas area */}
          <div className="relative overflow-auto rounded-xl border border-border bg-muted/30 flex justify-center" style={{ maxHeight: "70vh" }}>
            <div
              ref={canvasContainerRef}
              className="relative inline-block"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
                cursor:
                  activeTool === "text"
                    ? "text"
                    : activeTool === "whiteout"
                    ? "crosshair"
                    : activeTool === "draw"
                    ? "crosshair"
                    : activeTool === "select"
                    ? "default"
                    : "default",
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={() => {
                if (isDrawing) handleCanvasMouseUp({} as any);
              }}
            >
              {/* PDF page image */}
              {pageImages[currentPage] && (
                <img
                  src={pageImages[currentPage]}
                  alt={`Page ${currentPage + 1}`}
                  className="block select-none pointer-events-none"
                  draggable={false}
                />
              )}

              {/* Render elements */}
              {currentPageElements.map((el) => {
                if (el.type === "whiteout") {
                  return (
                    <div
                      key={el.id}
                      className={cn(
                        "absolute",
                        selectedElement === el.id && "ring-2 ring-primary ring-offset-1"
                      )}
                      style={{
                        left: el.x,
                        top: el.y,
                        width: el.width,
                        height: el.height,
                        backgroundColor: el.color,
                      }}
                    />
                  );
                }

                if (el.type === "text") {
                  return (
                    <div
                      key={el.id}
                      className={cn(
                        "absolute",
                        selectedElement === el.id && "ring-2 ring-primary ring-offset-1 rounded"
                      )}
                      style={{
                        left: el.x,
                        top: el.y - el.fontSize * 1.2,
                        cursor: activeTool === "select" ? "move" : "default",
                      }}
                    >
                      {editingText === el.id ? (
                        <input
                          autoFocus
                          value={el.text}
                          onChange={(e) =>
                            setElements((prev) =>
                              prev.map((item) =>
                                item.id === el.id && item.type === "text"
                                  ? { ...item, text: e.target.value }
                                  : item
                              )
                            )
                          }
                          onBlur={() => {
                            pushUndo();
                            setEditingText(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              pushUndo();
                              setEditingText(null);
                            }
                          }}
                          className="bg-transparent border-none outline-none p-0 m-0"
                          style={{
                            color: el.color,
                            fontSize: el.fontSize,
                            fontWeight: el.bold ? "bold" : "normal",
                            fontStyle: el.italic ? "italic" : "normal",
                            fontFamily: el.fontFamily,
                            minWidth: "50px",
                          }}
                        />
                      ) : (
                        <span
                          onDoubleClick={() => {
                            if (activeTool === "select") {
                              setEditingText(el.id);
                              setSelectedElement(el.id);
                            }
                          }}
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
                      )}
                    </div>
                  );
                }

                if (el.type === "image") {
                  return (
                    <div
                      key={el.id}
                      className={cn(
                        "absolute",
                        selectedElement === el.id && "ring-2 ring-primary ring-offset-1"
                      )}
                      style={{
                        left: el.x,
                        top: el.y,
                        width: el.width,
                        height: el.height,
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
                        selectedElement === el.id && "drop-shadow-[0_0_3px_rgba(139,92,246,0.8)]"
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

              {/* Drawing preview for whiteout */}
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

              {/* Drawing preview for freehand */}
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

          {/* Tip */}
          <p className="text-xs text-center text-muted-foreground">
            {activeTool === "select" && "Click to select elements. Double-click text to edit. Drag to move."}
            {activeTool === "text" && "Click anywhere on the page to place text. Edit it by double-clicking."}
            {activeTool === "whiteout" && "Click and drag to draw a rectangle. Use this to cover existing text."}
            {activeTool === "draw" && "Click and drag to draw freehand lines on the page."}
            {activeTool === "image" && "Select an image file to place on the page."}
          </p>

          {/* New file button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFiles([]);
                setPageImages([]);
                setPdfBytes(null);
                setElements([]);
                setSelectedElement(null);
                setUndoStack([]);
                setRedoStack([]);
              }}
            >
              Upload Different PDF
            </Button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
