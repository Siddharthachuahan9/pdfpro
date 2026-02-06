"use client";

import { useState, useCallback } from "react";
import { Minimize2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { compressPDF } from "@/lib/pdf/pdf-utils";
import { downloadPDF, formatFileSize } from "@/lib/utils";
import { ToolSEOContent } from "@/components/seo/tool-seo-content";

export default function CompressPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [originalSize, setOriginalSize] = useState(0);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setResult(null);
    if (newFiles.length > 0) {
      setOriginalSize(newFiles[0].size);
    }
  }, []);

  const handleCompress = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(20);

    try {
      setProgress(50);
      const compressed = await compressPDF(files[0]);
      setProgress(90);
      setResult(compressed);
      setProgress(100);
    } catch (err) {
      console.error("Compress failed:", err);
      alert("Failed to compress PDF. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadPDF(result, "compressed.pdf");
  };

  const reduction = result
    ? Math.max(0, Math.round(((originalSize - result.length) / originalSize) * 100))
    : 0;

  return (
    <ToolLayout
      title="Compress PDF"
      description="Reduce PDF file size while keeping quality"
      icon={Minimize2}
      color="from-green-500 to-emerald-500"
      processing={processing}
      progress={progress}
    >
      <div className="space-y-6">
        <FileUpload
          accept=".pdf"
          onFilesSelected={handleFilesSelected}
          files={files}
          onRemoveFile={() => {
            setFiles([]);
            setResult(null);
          }}
          label="Upload PDF to compress"
          description="Drop a PDF file here"
        />

        <Button
          onClick={handleCompress}
          disabled={files.length === 0 || processing}
          className="w-full"
          size="lg"
        >
          {processing ? "Compressing..." : "Compress PDF"}
        </Button>

        {result && (
          <div className="space-y-4">
            <div className="glass rounded-xl p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Original</p>
                  <p className="font-semibold">{formatFileSize(originalSize)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Compressed</p>
                  <p className="font-semibold text-green-500">
                    {formatFileSize(result.length)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Reduction</p>
                  <p className="font-semibold text-primary">{reduction}%</p>
                </div>
              </div>
            </div>

            <Button onClick={handleDownload} size="lg" className="w-full gap-2">
              <Download className="h-4 w-4" />
              Download Compressed PDF
            </Button>
          </div>
        )}
      </div>
      <ToolSEOContent toolId="compress" toolName="Compress PDF" />
    </ToolLayout>
  );
}
