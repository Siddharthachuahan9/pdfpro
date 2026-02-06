"use client";

import { useState, useCallback } from "react";
import { ArrowUpDown, Download, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { reorderPages, getPDFPageCount } from "@/lib/pdf/pdf-utils";
import { downloadPDF } from "@/lib/utils";

export default function ReorderPagesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);

  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    setFiles(newFiles);
    setResult(null);
    if (newFiles.length > 0) {
      const count = await getPDFPageCount(newFiles[0]);
      setPageCount(count);
      setOrder(Array.from({ length: count }, (_, i) => i));
    }
  }, []);

  const moveItem = (from: number, to: number) => {
    setOrder((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
    setResult(null);
  };

  const handleReorder = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(20);

    try {
      setProgress(50);
      const data = await reorderPages(files[0], order);
      setProgress(90);
      setResult(data);
      setProgress(100);
    } catch (err) {
      console.error("Reorder failed:", err);
      alert("Failed to reorder pages.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadPDF(result, "reordered.pdf");
  };

  return (
    <ToolLayout
      title="Reorder Pages"
      description="Rearrange pages in your PDF document"
      icon={ArrowUpDown}
      color="from-purple-500 to-fuchsia-500"
      processing={processing}
      progress={progress}
    >
      <div className="space-y-6">
        <FileUpload
          accept=".pdf"
          onFilesSelected={handleFilesSelected}
          files={files}
          onRemoveFile={() => { setFiles([]); setPageCount(0); setOrder([]); setResult(null); }}
          label="Upload PDF"
          description="Drop a PDF file here"
        />

        {order.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Reorder pages (use buttons to move)</p>
            <div className="space-y-1">
              {order.map((pageIdx, arrIdx) => (
                <div
                  key={`${pageIdx}-${arrIdx}`}
                  className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm flex-1">Page {pageIdx + 1}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" disabled={arrIdx === 0} onClick={() => moveItem(arrIdx, arrIdx - 1)}>
                      Up
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" disabled={arrIdx === order.length - 1} onClick={() => moveItem(arrIdx, arrIdx + 1)}>
                      Down
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleReorder} disabled={files.length === 0 || processing} className="w-full" size="lg">
          {processing ? "Reordering..." : "Reorder Pages"}
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
