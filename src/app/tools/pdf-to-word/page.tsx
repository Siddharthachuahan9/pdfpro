"use client";

import { useState, useCallback } from "react";
import { FileOutput, Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { extractParagraphsFromPDF } from "@/lib/pdf/pdf-render";
import { paragraphsToDocx, paragraphsToText } from "@/lib/pdf-to-docx";
import { downloadBlob } from "@/lib/utils";
import { ToolSEOContent } from "@/components/seo/tool-seo-content";

export default function PDFToWordPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [docx, setDocx] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setText("");
    setDocx(null);
    setError(null);
  }, []);

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(20);

    try {
      setError(null);
      const pages = await extractParagraphsFromPDF(files[0], (p) => setProgress(20 + Math.round(p * 60)));
      const plain = paragraphsToText(pages);
      if (!pages.some((p) => p.length > 0)) {
        setText("");
        setDocx(null);
        setError("No text found. This looks like a scanned PDF. Use Extract Text, which can read scanned pages with OCR.");
        return;
      }
      setProgress(85);
      setDocx(await paragraphsToDocx(pages));
      setText(plain);
      setProgress(100);
    } catch (err) {
      console.error("Conversion failed:", err);
      setError("Could not read this PDF. If it has a password, unlock it first.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const baseName = files[0]?.name.replace(/\.pdf$/i, "") || "document";
  const handleDownload = () => {
    if (docx) downloadBlob(docx, `${baseName}.docx`);
  };

  return (
    <ToolLayout
      title="PDF to Word"
      description="Turn a PDF's text into an editable Word (.docx) document. Layout, images and tables are not kept."
      icon={FileOutput}
      color="from-indigo-500 to-violet-500"
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

        <Button
          onClick={handleConvert}
          disabled={files.length === 0 || processing}
          className="w-full"
          size="lg"
        >
          {processing ? "Converting..." : "Convert to Word"}
        </Button>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        {text && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Text in your Word file</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1">
                  <Download className="h-3.5 w-3.5" />
                  Download .docx
                </Button>
              </div>
            </div>
            <div className="max-h-96 overflow-auto rounded-lg border border-border bg-secondary/30 p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono">{text}</pre>
            </div>
          </div>
        )}
      </div>
      <ToolSEOContent toolId="pdf-to-word" toolName="PDF to Word" />
    </ToolLayout>
  );
}
