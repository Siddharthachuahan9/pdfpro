"use client";

import { useState, useCallback } from "react";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { downloadBlob } from "@/lib/utils";
import { ToolSEOContent } from "@/components/seo/tool-seo-content";

export default function WordToPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setResult(null);
  }, []);

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(20);

    try {
      const { docxToPdf } = await import("@/lib/docx-to-pdf");
      setProgress(40);
      const blob = await docxToPdf(files[0]);
      setProgress(90);
      setResult(blob);
      setProgress(100);
    } catch (err) {
      console.error("Conversion failed:", err);
      alert("Could not convert this file. Only .docx (Word 2007 or newer) files are supported.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadBlob(result, `${files[0]?.name.replace(/\.docx$/i, "") || "document"}.pdf`);
  };

  return (
    <ToolLayout
      title="Word to PDF"
      description="Convert Word (.docx) documents to PDF, keeping headings, paragraphs, lists and images"
      icon={FileText}
      color="from-blue-600 to-indigo-600"
      processing={processing}
      progress={progress}
    >
      <div className="space-y-6">
        <FileUpload
          accept=".docx"
          onFilesSelected={handleFilesSelected}
          files={files}
          onRemoveFile={() => {
            setFiles([]);
            setResult(null);
          }}
          label="Upload Word document"
          description="Drop a .docx file here"
        />

        <Button
          onClick={handleConvert}
          disabled={files.length === 0 || processing}
          className="w-full"
          size="lg"
        >
          {processing ? "Converting..." : "Convert to PDF"}
        </Button>

        {result && (
          <Button onClick={handleDownload} size="lg" className="w-full gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        )}
      </div>
      <ToolSEOContent toolId="word-to-pdf" toolName="Word to PDF" />
    </ToolLayout>
  );
}
