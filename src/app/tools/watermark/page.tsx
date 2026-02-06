"use client";

import { useState, useCallback } from "react";
import { Droplets, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { addWatermark } from "@/lib/pdf/pdf-utils";
import { downloadPDF } from "@/lib/utils";
import { ToolSEOContent } from "@/components/seo/tool-seo-content";

export default function WatermarkPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(30);
  const [rotation, setRotation] = useState(-45);
  const [position, setPosition] = useState<"center" | "top-left" | "top-right" | "bottom-left" | "bottom-right">("center");

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setResult(null);
  }, []);

  const handleProcess = async () => {
    if (files.length === 0 || !text) return;
    setProcessing(true);
    setProgress(20);

    try {
      setProgress(50);
      const data = await addWatermark(files[0], text, {
        fontSize,
        opacity: opacity / 100,
        rotation,
        position,
      });
      setProgress(90);
      setResult(data);
      setProgress(100);
    } catch (err) {
      console.error("Watermark failed:", err);
      alert("Failed to add watermark.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadPDF(result, "watermarked.pdf");
  };

  return (
    <ToolLayout
      title="Add Watermark"
      description="Add text watermark to PDF pages"
      icon={Droplets}
      color="from-cyan-500 to-blue-500"
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

        {files.length > 0 && (
          <div className="space-y-4 p-4 rounded-xl border border-border bg-secondary/20">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Watermark Text</label>
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter watermark text" />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Font Size: {fontSize}px</label>
              <Slider value={[fontSize]} onValueChange={([v]) => setFontSize(v)} min={12} max={120} step={2} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Opacity: {opacity}%</label>
              <Slider value={[opacity]} onValueChange={([v]) => setOpacity(v)} min={5} max={100} step={5} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Rotation: {rotation}°</label>
              <Slider value={[rotation]} onValueChange={([v]) => setRotation(v)} min={-180} max={180} step={5} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Position</label>
              <Select value={position} onValueChange={(v: typeof position) => setPosition(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="top-left">Top Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <Button onClick={handleProcess} disabled={files.length === 0 || !text || processing} className="w-full" size="lg">
          {processing ? "Adding Watermark..." : "Add Watermark"}
        </Button>

        {result && (
          <Button onClick={handleDownload} size="lg" className="w-full gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        )}
      </div>
      <ToolSEOContent toolId="watermark" toolName="Add Watermark" />
    </ToolLayout>
  );
}
