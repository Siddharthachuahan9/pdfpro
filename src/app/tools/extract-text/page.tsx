"use client";

import { useState, useCallback } from "react";
import { Type, Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { extractTextWithOCR } from "@/lib/pdf/pdf-render";
import { downloadBlob } from "@/lib/utils";
import { ToolSEOContent } from "@/components/seo/tool-seo-content";

export default function ExtractTextPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("");
  const [useOcr, setUseOcr] = useState(true);
  const [ocrPages, setOcrPages] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setText("");
    setOcrPages([]);
    setError(null);
  }, []);

  const handleExtract = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(20);

    try {
      setError(null);
      const pages = await extractTextWithOCR(files[0], {
        ocr: useOcr,
        onStatus: (msg, p) => {
          setStatus(msg);
          setProgress(20 + Math.round(p * 75));
        },
      });
      setOcrPages(pages.filter((p) => p.ocr).map((p) => p.page));
      const joined = pages.map((p) => `--- Page ${p.page} ---\n${p.text}`).join("\n\n");
      if (!pages.some((p) => p.text.trim())) {
        setText("");
        setError(
          useOcr
            ? "No readable text was found, even with OCR."
            : "This PDF has no text layer (it is probably a scan). Turn on OCR to read it."
        );
      } else {
        setText(joined);
      }
      setProgress(100);
    } catch (err) {
      console.error("Extraction failed:", err);
      setError("Could not read this PDF. If it has a password, unlock it first.");
    } finally {
      setProcessing(false);
      setStatus("");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain" });
    downloadBlob(blob, `${files[0]?.name.replace(/\.pdf$/i, "") || "extracted"}.txt`);
  };

  return (
    <ToolLayout
      title="Extract Text"
      description="Extract all text content from a PDF"
      icon={Type}
      color="from-slate-500 to-gray-600"
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
            setText("");
          }}
          label="Upload PDF"
          description="Drop a PDF file here"
        />

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={useOcr} onChange={(e) => setUseOcr(e.target.checked)} />
          <span>
            Read scanned pages with OCR (English)
            <span className="block text-xs text-muted-foreground">
              Used only for pages with no text. The OCR engine (about 15 MB) downloads once; your PDF stays on your device.
            </span>
          </span>
        </label>

        {processing && status && <p className="text-sm text-muted-foreground" aria-live="polite">{status}</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <Button
          onClick={handleExtract}
          disabled={files.length === 0 || processing}
          className="w-full"
          size="lg"
        >
          {processing ? "Extracting..." : "Extract Text"}
        </Button>

        {text && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Extracted Text ({text.length.toLocaleString()} characters)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1">
                  <Download className="h-3.5 w-3.5" />
                  Download .txt
                </Button>
              </div>
            </div>
            {ocrPages.length > 0 && (
              <p className="text-xs text-muted-foreground">
                OCR was used on page{ocrPages.length > 1 ? "s" : ""} {ocrPages.join(", ")}. Check OCR text for mistakes.
              </p>
            )}
            <div className="max-h-96 overflow-auto rounded-lg border border-border bg-secondary/30 p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono">{text}</pre>
            </div>
          </div>
        )}
      </div>
      <ToolSEOContent toolId="extract-text" toolName="Extract Text" />
    </ToolLayout>
  );
}
