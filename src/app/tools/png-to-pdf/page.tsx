"use client";

import { useState, useCallback } from "react";
import { ImagePlus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { imagesToPDF } from "@/lib/pdf/pdf-utils";
import { downloadPDF } from "@/lib/utils";

export default function PNGToPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setResult(null);
  }, []);

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(20);

    try {
      setProgress(50);
      const pdf = await imagesToPDF(files);
      setProgress(90);
      setResult(pdf);
      setProgress(100);
    } catch (err) {
      console.error("Conversion failed:", err);
      alert("Failed to convert images to PDF.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadPDF(result, "images-to-pdf.pdf");
  };

  return (
    <ToolLayout
      title="PNG to PDF"
      description="Convert PNG images to a PDF document"
      icon={ImagePlus}
      color="from-teal-500 to-cyan-500"
      processing={processing}
      progress={progress}
    >
      <div className="space-y-6">
        <FileUpload
          accept=".png"
          multiple
          onFilesSelected={handleFilesSelected}
          files={files}
          onRemoveFile={(idx) => {
            setFiles((prev) => prev.filter((_, i) => i !== idx));
            setResult(null);
          }}
          label="Upload PNG images"
          description="Drop PNG files here (multiple supported)"
        />

        <Button
          onClick={handleConvert}
          disabled={files.length === 0 || processing}
          className="w-full"
          size="lg"
        >
          {processing ? "Converting..." : "Convert to PDF"}
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
