"use client";

import { useState, useCallback } from "react";
import { Crop, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { cropPDF } from "@/lib/pdf/pdf-utils";
import { downloadPDF } from "@/lib/utils";

export default function CropPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [margins, setMargins] = useState({ left: 0, bottom: 0, right: 0, top: 0 });

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setResult(null);
  }, []);

  const handleCrop = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(20);

    try {
      setProgress(50);
      const data = await cropPDF(files[0], margins);
      setProgress(90);
      setResult(data);
      setProgress(100);
    } catch (err) {
      console.error("Crop failed:", err);
      alert("Failed to crop PDF.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadPDF(result, "cropped.pdf");
  };

  return (
    <ToolLayout
      title="Crop PDF"
      description="Crop and resize PDF page dimensions"
      icon={Crop}
      color="from-fuchsia-500 to-pink-500"
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
            <p className="text-sm font-medium">Crop Margins (points)</p>
            <div className="grid grid-cols-2 gap-4">
              {(["top", "bottom", "left", "right"] as const).map((side) => (
                <div key={side}>
                  <label className="text-xs text-muted-foreground capitalize mb-1 block">{side}</label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[margins[side]]}
                      onValueChange={([v]) => setMargins((prev) => ({ ...prev, [side]: v }))}
                      min={0}
                      max={200}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm w-10 text-right">{margins[side]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleCrop} disabled={files.length === 0 || processing} className="w-full" size="lg">
          {processing ? "Cropping..." : "Crop PDF"}
        </Button>

        {result && (
          <Button onClick={handleDownload} size="lg" className="w-full gap-2">
            <Download className="h-4 w-4" />
            Download Cropped PDF
          </Button>
        )}
      </div>
    </ToolLayout>
  );
}
