"use client";

import { useState, useCallback } from "react";
import { Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { deletePages, getPDFPageCount } from "@/lib/pdf/pdf-utils";
import { downloadPDF } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ToolSEOContent } from "@/components/seo/tool-seo-content";

export default function DeletePagesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);

  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    setFiles(newFiles);
    setResult(null);
    setSelectedPages(new Set());
    if (newFiles.length > 0) {
      const count = await getPDFPageCount(newFiles[0]);
      setPageCount(count);
    }
  }, []);

  const togglePage = (pageIdx: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageIdx)) {
        next.delete(pageIdx);
      } else {
        next.add(pageIdx);
      }
      return next;
    });
    setResult(null);
  };

  const handleDelete = async () => {
    if (files.length === 0 || selectedPages.size === 0) return;
    if (selectedPages.size >= pageCount) {
      alert("Cannot delete all pages.");
      return;
    }
    setProcessing(true);
    setProgress(20);

    try {
      setProgress(50);
      const data = await deletePages(files[0], Array.from(selectedPages));
      setProgress(90);
      setResult(data);
      setProgress(100);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete pages.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadPDF(result, "pages-deleted.pdf");
  };

  return (
    <ToolLayout
      title="Delete Pages"
      description="Remove unwanted pages from your PDF"
      icon={Trash2}
      color="from-red-500 to-rose-600"
      processing={processing}
      progress={progress}
    >
      <div className="space-y-6">
        <FileUpload
          accept=".pdf"
          onFilesSelected={handleFilesSelected}
          files={files}
          onRemoveFile={() => { setFiles([]); setPageCount(0); setSelectedPages(new Set()); setResult(null); }}
          label="Upload PDF"
          description="Drop a PDF file here"
        />

        {pageCount > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              Select pages to delete ({selectedPages.size} of {pageCount} selected)
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => togglePage(i)}
                  className={cn(
                    "h-10 w-10 rounded-lg text-sm font-medium transition-all border",
                    selectedPages.has(i)
                      ? "bg-destructive text-destructive-foreground border-destructive"
                      : "bg-secondary border-border hover:border-primary/50"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleDelete} disabled={files.length === 0 || selectedPages.size === 0 || processing} className="w-full" size="lg">
          {processing ? "Deleting..." : `Delete ${selectedPages.size} Page(s)`}
        </Button>

        {result && (
          <Button onClick={handleDownload} size="lg" className="w-full gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        )}
      </div>
      <ToolSEOContent toolId="delete-pages" toolName="Delete Pages" />
    </ToolLayout>
  );
}
