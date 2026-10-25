"use client";

import { useState, useCallback } from "react";
import { Minimize2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { compressPDFFile, type CompressLevel, type CompressResult } from "@/lib/pdf/compress";
import { downloadPDF, formatFileSize } from "@/lib/utils";
import { ToolSEOContent } from "@/components/seo/tool-seo-content";

export default function CompressPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CompressResult | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [level, setLevel] = useState<CompressLevel>("recommended");
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setResult(null);
    setError(null);
    if (newFiles.length > 0) {
      setOriginalSize(newFiles[0].size);
    }
  }, []);

  const handleCompress = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(5);
    setResult(null);
    setError(null);

    try {
      const res = await compressPDFFile(files[0], level, (p) =>
        setProgress(5 + Math.round(p * 90))
      );
      setResult(res);
      setProgress(100);
    } catch (err) {
      console.error("Compress failed:", err);
      setError(
        err instanceof Error && /encrypt/i.test(err.message)
          ? "This PDF is password-protected. Unlock it first, then compress."
          : "Could not read this PDF. It may be damaged."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const base = files[0]?.name.replace(/\.pdf$/i, "") || "document";
    downloadPDF(result.bytes, `${base}-compressed.pdf`);
  };

  const reduction = result
    ? Math.max(0, Math.round(((originalSize - result.bytes.length) / originalSize) * 100))
    : 0;

  const levels: { id: CompressLevel; label: string; hint: string }[] = [
    { id: "light", label: "Light", hint: "Small savings, best image quality" },
    { id: "recommended", label: "Recommended", hint: "Re-encodes images at good quality" },
    { id: "strong", label: "Strong", hint: "Turns pages into images. Text is no longer selectable" },
  ];

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

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium mb-2">Compression level</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {levels.map((l) => (
              <label
                key={l.id}
                className={`cursor-pointer rounded-lg border p-3 text-sm transition-colors ${
                  level === l.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <input
                  type="radio"
                  name="level"
                  value={l.id}
                  checked={level === l.id}
                  onChange={() => {
                    setLevel(l.id);
                    setResult(null);
                  }}
                  className="sr-only"
                />
                <span className="font-medium block">{l.label}</span>
                <span className="text-xs text-muted-foreground">{l.hint}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Savings come from images. A PDF that is mostly text may not get smaller.
          </p>
        </fieldset>

        {error && (
          <p role="alert" className="text-sm text-destructive">{error}</p>
        )}

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
                    {formatFileSize(result.bytes.length)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Reduction</p>
                  <p className="font-semibold text-primary">{reduction}%</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-center text-muted-foreground">
              {result.reduced
                ? result.rasterized
                  ? "Pages were converted to images. Text in the result cannot be selected or searched."
                  : result.imagesFound === 0
                    ? "This PDF has no images, so only its structure was re-saved more compactly. Text and layout are unchanged."
                    : `${result.imagesRecompressed} of ${result.imagesFound} images re-encoded. Text and layout are unchanged.`
                : "This PDF is already as small as this level can make it, so the download is your original file unchanged."}
            </p>

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
