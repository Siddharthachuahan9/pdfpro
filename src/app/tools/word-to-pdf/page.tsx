"use client";

import { useState, useCallback } from "react";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { downloadBlob } from "@/lib/utils";

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
      const mammoth = await import("mammoth");
      const arrayBuffer = await files[0].arrayBuffer();
      setProgress(40);
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
      setProgress(60);

      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      const textContent = tempDiv.textContent || tempDiv.innerText || "";

      const lines = doc.splitTextToSize(textContent, 170);
      let y = 20;
      const lineHeight = 6;

      for (const line of lines) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += lineHeight;
      }

      setProgress(90);
      const blob = doc.output("blob");
      setResult(blob);
      setProgress(100);
    } catch (err) {
      console.error("Conversion failed:", err);
      alert("Failed to convert Word to PDF.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadBlob(result, "converted.pdf");
  };

  return (
    <ToolLayout
      title="Word to PDF"
      description="Convert Word documents to PDF format"
      icon={FileText}
      color="from-blue-600 to-indigo-600"
      processing={processing}
      progress={progress}
    >
      <div className="space-y-6">
        <FileUpload
          accept=".docx,.doc"
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
    </ToolLayout>
  );
}
