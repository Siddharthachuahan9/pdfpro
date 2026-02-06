"use client";

import { useState, useCallback } from "react";
import { Merge, Download, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { mergePDFs } from "@/lib/pdf/pdf-utils";
import { downloadPDF } from "@/lib/utils";

export default function MergePDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setDone(false);
    setResult(null);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setDone(false);
    setResult(null);
  }, []);

  const moveFile = useCallback((from: number, to: number) => {
    setFiles((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  }, []);

  const handleMerge = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    setProgress(10);

    try {
      setProgress(30);
      const merged = await mergePDFs(files);
      setProgress(90);
      setResult(merged);
      setDone(true);
      setProgress(100);
    } catch (err) {
      console.error("Merge failed:", err);
      alert("Failed to merge PDFs. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadPDF(result, "merged.pdf");
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setDone(false);
    setProgress(0);
  };

  return (
    <ToolLayout
      title="Merge PDF"
      description="Combine multiple PDFs into one document"
      icon={Merge}
      color="from-violet-500 to-purple-600"
      processing={processing}
      progress={progress}
    >
      <div className="space-y-6">
        <FileUpload
          accept=".pdf"
          multiple
          onFilesSelected={handleFilesSelected}
          files={files}
          onRemoveFile={removeFile}
          label="Upload PDFs to merge"
          description="Drop multiple PDF files here"
        />

        {files.length > 1 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Drag to reorder ({files.length} files)
            </p>
            <div className="space-y-1">
              {files.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <span className="text-sm flex-1 truncate">{file.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      disabled={idx === 0}
                      onClick={() => moveFile(idx, idx - 1)}
                    >
                      Up
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      disabled={idx === files.length - 1}
                      onClick={() => moveFile(idx, idx + 1)}
                    >
                      Down
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleMerge}
            disabled={files.length < 2 || processing}
            className="flex-1"
            size="lg"
          >
            {processing ? "Merging..." : "Merge PDFs"}
          </Button>
          {done && (
            <Button onClick={handleDownload} size="lg" className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}
          {files.length > 0 && (
            <Button variant="outline" size="lg" onClick={handleReset}>
              Reset
            </Button>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
