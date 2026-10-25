"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { PenTool, Download, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { addSignature } from "@/lib/pdf/pdf-utils";
import { downloadPDF } from "@/lib/utils";
import { renderPDFPagePreview } from "@/lib/pdf/pdf-render";
import { ToolSEOContent } from "@/components/seo/tool-seo-content";

export default function SignPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);
  /* Trimmed signature image + its aspect ratio, for the preview and the PDF */
  const [sigImage, setSigImage] = useState<{ dataUrl: string; aspect: number } | null>(null);

  /* Placement */
  const [numPages, setNumPages] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [preview, setPreview] = useState<{ dataUrl: string; aspect: number } | null>(null);
  const [placement, setPlacement] = useState({ cx: 0.72, cy: 0.88 });
  const [widthFrac, setWidthFrac] = useState(0.3);
  const previewRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const setupCtx = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return null;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return ctx;
  };

  /* Canvas is 600x200 internally but drawn at CSS size: scale the pointer */
  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ctx = setupCtx();
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x + 0.1, pos.y + 0.1);
    ctx.stroke();
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  };

  /* Crop the drawing to its ink so size and position are predictable */
  const captureSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const { width: w, height: h } = canvas;
    const data = ctx.getImageData(0, 0, w, h).data;
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return;
    const pad = 6;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(w - 1, maxX + pad);
    maxY = Math.min(h - 1, maxY + pad);
    const cw = maxX - minX + 1;
    const ch = maxY - minY + 1;
    const out = document.createElement("canvas");
    out.width = cw;
    out.height = ch;
    out.getContext("2d")!.drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);
    setSigImage({ dataUrl: out.toDataURL("image/png"), aspect: cw / ch });
  };

  const stopDraw = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    captureSignature();
    setResult(null);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSigImage(null);
    setResult(null);
  };

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setResult(null);
    setError(null);
    setPageIndex(0);
    setPreview(null);
    setNumPages(0);
  }, []);

  /* Render the chosen page so the user can see where the signature goes */
  useEffect(() => {
    const file = files[0];
    if (!file) return;
    let cancelled = false;
    renderPDFPagePreview(file, pageIndex + 1, 1.2)
      .then((r) => {
        if (cancelled) return;
        setNumPages(r.numPages);
        setPreview({ dataUrl: r.dataUrl, aspect: r.width / r.height });
      })
      .catch(() => {
        if (!cancelled) setError("Could not open this PDF. If it has a password, unlock it first.");
      });
    return () => {
      cancelled = true;
    };
  }, [files, pageIndex]);

  const moveTo = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const cy = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    setPlacement({ cx, cy });
    setResult(null);
  };

  const handleSign = async () => {
    if (files.length === 0 || !sigImage) return;
    setProcessing(true);
    setProgress(20);
    setError(null);

    try {
      setProgress(50);
      const data = await addSignature(files[0], sigImage.dataUrl, pageIndex, {
        cx: placement.cx,
        cy: placement.cy,
        widthFrac,
        aspect: sigImage.aspect,
      });
      setProgress(90);
      setResult(data);
      setProgress(100);
    } catch (err) {
      console.error("Sign failed:", err);
      setError("Failed to add the signature. If the PDF has a password, unlock it first.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const base = files[0]?.name.replace(/\.pdf$/i, "") || "document";
    downloadPDF(result, `${base}-signed.pdf`);
  };

  /* Signature box in preview percentages */
  const sigH = preview && sigImage ? (widthFrac / sigImage.aspect) * preview.aspect : 0;

  return (
    <ToolLayout
      title="Sign PDF"
      description="Draw your signature and place it on any page of a PDF"
      icon={PenTool}
      color="from-violet-600 to-purple-700"
      processing={processing}
      progress={progress}
    >
      <div className="space-y-6">
        <FileUpload
          accept=".pdf"
          onFilesSelected={handleFilesSelected}
          files={files}
          onRemoveFile={() => { setFiles([]); setResult(null); setPreview(null); setNumPages(0); }}
          label="Upload PDF"
          description="Drop a PDF file here"
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Draw Your Signature</label>
            <Button variant="ghost" size="sm" onClick={clearSignature} className="gap-1">
              <Eraser className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
          <div className="rounded-xl border-2 border-dashed border-border bg-white overflow-hidden">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              aria-label="Signature pad"
              className="w-full h-[200px] cursor-crosshair touch-none"
              style={{ touchAction: "none" }}
              onPointerDown={startDraw}
              onPointerMove={draw}
              onPointerUp={stopDraw}
              onPointerCancel={stopDraw}
            />
          </div>
        </div>

        {files.length > 0 && preview && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-4">
              <label className="text-sm font-medium flex items-center gap-2">
                Page
                <select
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                  value={pageIndex}
                  onChange={(e) => { setPageIndex(Number(e.target.value)); setResult(null); }}
                >
                  {Array.from({ length: numPages }, (_, i) => (
                    <option key={i} value={i}>{i + 1} of {numPages}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium flex items-center gap-2 flex-1 min-w-[200px]">
                Size
                <input
                  type="range"
                  min={0.08}
                  max={0.7}
                  step={0.01}
                  value={widthFrac}
                  onChange={(e) => { setWidthFrac(Number(e.target.value)); setResult(null); }}
                  className="flex-1"
                  aria-label="Signature size"
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Tap or drag on the page to place the signature.
            </p>
            <div
              ref={previewRef}
              className="relative mx-auto max-w-md border border-border rounded-lg overflow-hidden bg-white select-none"
              style={{ aspectRatio: String(preview.aspect), touchAction: "none" }}
              onPointerDown={(e) => { draggingRef.current = true; e.currentTarget.setPointerCapture(e.pointerId); moveTo(e); }}
              onPointerMove={(e) => { if (draggingRef.current) moveTo(e); }}
              onPointerUp={() => { draggingRef.current = false; }}
              onPointerCancel={() => { draggingRef.current = false; }}
              data-testid="sign-preview"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview.dataUrl} alt={`Page ${pageIndex + 1}`} className="w-full h-full pointer-events-none" draggable={false} />
              {sigImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sigImage.dataUrl}
                  alt="Your signature"
                  className="absolute pointer-events-none outline outline-1 outline-dashed outline-primary"
                  style={{
                    width: `${widthFrac * 100}%`,
                    height: `${sigH * 100}%`,
                    left: `${(placement.cx - widthFrac / 2) * 100}%`,
                    top: `${(placement.cy - sigH / 2) * 100}%`,
                  }}
                  draggable={false}
                />
              ) : (
                <div
                  className="absolute pointer-events-none border-2 border-dashed border-primary/60 rounded"
                  style={{
                    width: `${widthFrac * 100}%`,
                    height: "6%",
                    left: `${(placement.cx - widthFrac / 2) * 100}%`,
                    top: `${placement.cy * 100 - 3}%`,
                  }}
                />
              )}
            </div>
          </div>
        )}

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleSign} disabled={files.length === 0 || !hasSignature || !sigImage || processing} className="w-full" size="lg">
          {processing ? "Signing..." : "Sign PDF"}
        </Button>

        {result && (
          <Button onClick={handleDownload} size="lg" className="w-full gap-2">
            <Download className="h-4 w-4" />
            Download Signed PDF
          </Button>
        )}
      </div>
      <ToolSEOContent toolId="sign-pdf" toolName="Sign PDF" />
    </ToolLayout>
  );
}
