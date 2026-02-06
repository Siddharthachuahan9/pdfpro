"use client";

import { useState, useCallback } from "react";
import { Split, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { splitPDF, getPDFPageCount } from "@/lib/pdf/pdf-utils";
import { downloadPDF } from "@/lib/utils";
import { ToolSEOContent } from "@/components/seo/tool-seo-content";

export default function SplitPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [rangeText, setRangeText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Uint8Array[]>([]);

  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    setFiles(newFiles);
    setResults([]);
    if (newFiles.length > 0) {
      const count = await getPDFPageCount(newFiles[0]);
      setPageCount(count);
      setRangeText(`1-${count}`);
    }
  }, []);

  const parseRanges = (text: string): { start: number; end: number }[] => {
    return text.split(",").map((r) => {
      const parts = r.trim().split("-");
      const start = parseInt(parts[0]) - 1;
      const end = parts.length > 1 ? parseInt(parts[1]) - 1 : start;
      return { start, end };
    }).filter(r => !isNaN(r.start) && !isNaN(r.end));
  };

  const handleSplit = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(20);

    try {
      const ranges = parseRanges(rangeText);
      setProgress(40);
      const splitResults = await splitPDF(files[0], ranges);
      setProgress(90);
      setResults(splitResults);
      setProgress(100);
    } catch (err) {
      console.error("Split failed:", err);
      alert("Failed to split PDF. Please check your page ranges.");
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = (idx: number) => {
    downloadPDF(results[idx], `split-${idx + 1}.pdf`);
  };

  const downloadAll = () => {
    results.forEach((r, i) => {
      downloadPDF(r, `split-${i + 1}.pdf`);
    });
  };

  return (
    <ToolLayout
      title="Split PDF"
      description="Extract pages or split PDF into multiple files"
      icon={Split}
      color="from-blue-500 to-cyan-500"
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
            setPageCount(0);
            setResults([]);
          }}
          label="Upload PDF to split"
          description="Drop a PDF file here"
        />

        {pageCount > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Total pages: <span className="font-medium text-foreground">{pageCount}</span>
            </p>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Page ranges (comma-separated)
              </label>
              <Input
                value={rangeText}
                onChange={(e) => setRangeText(e.target.value)}
                placeholder="e.g. 1-3, 4-6, 7-10"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Example: 1-3, 4-6 will create 2 PDF files
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleSplit}
            disabled={files.length === 0 || processing}
            className="flex-1"
            size="lg"
          >
            {processing ? "Splitting..." : "Split PDF"}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {results.length} file(s) created
              </p>
              <Button variant="outline" size="sm" onClick={downloadAll}>
                Download All
              </Button>
            </div>
            {results.map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border"
              >
                <span className="text-sm">split-{idx + 1}.pdf</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadResult(idx)}
                  className="gap-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ToolSEOContent toolId="split" toolName="Split PDF" />
    </ToolLayout>
  );
}
