"use client";

import { useState, useCallback } from "react";
import { FileOutput, Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { extractTextFromPDF } from "@/lib/pdf/pdf-render";
import { downloadBlob } from "@/lib/utils";

export default function PDFToWordPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setText("");
  }, []);

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(20);

    try {
      setProgress(40);
      const extracted = await extractTextFromPDF(files[0]);
      setProgress(90);
      setText(extracted);
      setProgress(100);
    } catch (err) {
      console.error("Extraction failed:", err);
      alert("Failed to extract text from PDF.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain" });
    downloadBlob(blob, "extracted-text.txt");
  };

  return (
    <ToolLayout
      title="PDF to Word"
      description="Extract text from PDF to editable format"
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
          {processing ? "Extracting..." : "Extract Text"}
        </Button>

        {text && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Extracted Text</p>
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
            <div className="max-h-96 overflow-auto rounded-lg border border-border bg-secondary/30 p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono">{text}</pre>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
