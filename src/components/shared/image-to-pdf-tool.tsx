"use client";

import { useState, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { imagesToPDF, type ImagePageSize } from "@/lib/pdf/pdf-utils";
import { downloadPDF } from "@/lib/utils";
import { ToolSEOContent } from "@/components/seo/tool-seo-content";

interface ImageToPDFToolProps {
  toolId: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  accept: string;
  kind: string;
}

const SIZES: { id: ImagePageSize; label: string }[] = [
  { id: "a4", label: "A4" },
  { id: "letter", label: "US Letter" },
  { id: "original", label: "Image size (72 dpi)" },
];

export function ImageToPDFTool({ toolId, title, description, icon, color, accept, kind }: ImageToPDFToolProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<ImagePageSize>("a4");
  const [withMargin, setWithMargin] = useState(false);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setResult(null);
    setError(null);
  }, []);

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(20);
    setError(null);
    try {
      setProgress(50);
      const pdf = await imagesToPDF(files, { pageSize, margin: withMargin ? 36 : 0 });
      setProgress(90);
      setResult(pdf);
      setProgress(100);
    } catch (err) {
      console.error("Conversion failed:", err);
      setError("One of the images could not be read. Check that every file is a valid image.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolLayout title={title} description={description} icon={icon} color={color} processing={processing} progress={progress}>
      <div className="space-y-6">
        <FileUpload
          accept={accept}
          multiple
          onFilesSelected={handleFilesSelected}
          files={files}
          onRemoveFile={(idx) => {
            setFiles((prev) => prev.filter((_, i) => i !== idx));
            setResult(null);
          }}
          label={`Upload ${kind} images`}
          description={`Drop ${kind} files here (multiple supported, one image per page)`}
        />

        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-medium flex items-center gap-2">
            Page size
            <select
              className="rounded-md border border-border bg-background px-2 py-1 text-sm"
              value={pageSize}
              onChange={(e) => { setPageSize(e.target.value as ImagePageSize); setResult(null); }}
            >
              {SIZES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={withMargin} onChange={(e) => { setWithMargin(e.target.checked); setResult(null); }} />
            Add a margin
          </label>
        </div>
        <p className="text-xs text-muted-foreground -mt-3">
          A4 and Letter pages turn landscape for wide images. Images are scaled to fit and centred.
        </p>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <Button onClick={handleConvert} disabled={files.length === 0 || processing} className="w-full" size="lg">
          {processing ? "Converting..." : "Convert to PDF"}
        </Button>

        {result && (
          <Button onClick={() => downloadPDF(result, "images.pdf")} size="lg" className="w-full gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        )}
      </div>
      <ToolSEOContent toolId={toolId} toolName={title} />
    </ToolLayout>
  );
}
