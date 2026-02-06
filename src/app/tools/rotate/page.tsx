"use client";

import { useState, useCallback } from "react";
import { RotateCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { rotatePDF } from "@/lib/pdf/pdf-utils";
import { downloadPDF } from "@/lib/utils";

export default function RotatePDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [angle, setAngle] = useState("90");

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setResult(null);
  }, []);

  const handleRotate = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(20);

    try {
      setProgress(50);
      const data = await rotatePDF(files[0], parseInt(angle));
      setProgress(90);
      setResult(data);
      setProgress(100);
    } catch (err) {
      console.error("Rotate failed:", err);
      alert("Failed to rotate PDF.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadPDF(result, "rotated.pdf");
  };

  return (
    <ToolLayout
      title="Rotate PDF"
      description="Rotate PDF pages to any angle"
      icon={RotateCw}
      color="from-amber-500 to-yellow-500"
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
          <div className="p-4 rounded-xl border border-border bg-secondary/20">
            <label className="text-sm font-medium mb-1.5 block">Rotation Angle</label>
            <Select value={angle} onValueChange={setAngle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="90">90° Clockwise</SelectItem>
                <SelectItem value="180">180°</SelectItem>
                <SelectItem value="270">90° Counter-clockwise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Button onClick={handleRotate} disabled={files.length === 0 || processing} className="w-full" size="lg">
          {processing ? "Rotating..." : "Rotate PDF"}
        </Button>

        {result && (
          <Button onClick={handleDownload} size="lg" className="w-full gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        )}
      </div>
    </ToolLayout>
  );
}
