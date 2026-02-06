"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { PenTool, Download, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { addSignature } from "@/lib/pdf/pdf-utils";
import { downloadPDF } from "@/lib/utils";

export default function SignPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setResult(null);
  }, []);

  const handleSign = async () => {
    if (files.length === 0 || !hasSignature) return;
    setProcessing(true);
    setProgress(20);

    try {
      const canvas = canvasRef.current!;
      const dataUrl = canvas.toDataURL("image/png");
      setProgress(50);
      const data = await addSignature(files[0], dataUrl, 0, {
        x: 50,
        y: 50,
        width: 200,
        height: 80,
      });
      setProgress(90);
      setResult(data);
      setProgress(100);
    } catch (err) {
      console.error("Sign failed:", err);
      alert("Failed to add signature.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadPDF(result, "signed.pdf");
  };

  return (
    <ToolLayout
      title="Sign PDF"
      description="Draw and place your signature on a PDF"
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
          onRemoveFile={() => { setFiles([]); setResult(null); }}
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
              className="w-full h-[200px] cursor-crosshair touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Signature will be placed on the first page (bottom-left corner)
          </p>
        </div>

        <Button onClick={handleSign} disabled={files.length === 0 || !hasSignature || processing} className="w-full" size="lg">
          {processing ? "Signing..." : "Sign PDF"}
        </Button>

        {result && (
          <Button onClick={handleDownload} size="lg" className="w-full gap-2">
            <Download className="h-4 w-4" />
            Download Signed PDF
          </Button>
        )}
      </div>
    </ToolLayout>
  );
}
