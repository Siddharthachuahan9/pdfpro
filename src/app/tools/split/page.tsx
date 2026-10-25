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
  const [resultNames, setResultNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    setFiles(newFiles);
    setResults([]);
    setError(null);
    if (newFiles.length > 0) {
      try {
        const count = await getPDFPageCount(newFiles[0]);
        setPageCount(count);
        setRangeText(`1-${count}`);
      } catch {
        setPageCount(0);
        setError("Could not read this PDF. If it has a password, unlock it first.");
      }
    }
  }, []);

  /* Parse "1-3, 5, 8-10" into 0-based ranges, or explain what is wrong */
  const parseRanges = (
    text: string
  ): { ranges: { start: number; end: number }[]; error?: string } => {
    const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return { ranges: [], error: "Enter at least one page or range, e.g. 1-3, 5." };
    const ranges: { start: number; end: number }[] = [];
    for (const part of parts) {
      const m = part.match(/^(\d+)\s*(?:-\s*(\d+))?$/);
      if (!m) return { ranges: [], error: `"${part}" is not a page number or range like 2-5.` };
      const start = parseInt(m[1], 10);
      const end = m[2] ? parseInt(m[2], 10) : start;
      if (start < 1 || end < 1) return { ranges: [], error: `Pages start at 1 ("${part}").` };
      if (start > end) return { ranges: [], error: `"${part}" goes backwards. Write it as ${end}-${start}.` };
      if (end > pageCount) {
        return { ranges: [], error: `"${part}" is past the end. This PDF has ${pageCount} page${pageCount === 1 ? "" : "s"}.` };
      }
      ranges.push({ start: start - 1, end: end - 1 });
    }
    return { ranges };
  };

  const handleSplit = async () => {
    if (files.length === 0) return;
    const { ranges, error: parseError } = parseRanges(rangeText);
    setError(parseError ?? null);
    setResults([]);
    if (parseError) return;
    setProcessing(true);
    setProgress(20);

    try {
      setProgress(40);
      const base = files[0].name.replace(/\.pdf$/i, "") || "document";
      setResultNames(
        ranges.map((r) =>
          r.start === r.end ? `${base}-page-${r.start + 1}.pdf` : `${base}-pages-${r.start + 1}-${r.end + 1}.pdf`
        )
      );
      const splitResults = await splitPDF(files[0], ranges);
      setProgress(90);
      setResults(splitResults);
      setProgress(100);
    } catch (err) {
      console.error("Split failed:", err);
      setError("Failed to split this PDF.");
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = (idx: number) => {
    downloadPDF(results[idx], resultNames[idx] ?? `split-${idx + 1}.pdf`);
  };

  /* Space the downloads out: browsers drop rapid back-to-back downloads */
  const downloadAll = async () => {
    for (let i = 0; i < results.length; i++) {
      downloadResult(i);
      await new Promise((r) => setTimeout(r, 400));
    }
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
                onChange={(e) => { setRangeText(e.target.value); setError(null); }}
                aria-invalid={!!error}
                placeholder="e.g. 1-3, 4-6, 7-10"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Example: 1-3, 4-6 will create 2 PDF files
              </p>
            </div>
          </div>
        )}

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button
            onClick={handleSplit}
            disabled={files.length === 0 || pageCount === 0 || processing}
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
                <span className="text-sm">{resultNames[idx] ?? `split-${idx + 1}.pdf`}</span>
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
