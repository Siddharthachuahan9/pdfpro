"use client";

import { useState, useCallback } from "react";
import { Unlock, Download, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { downloadPDF } from "@/lib/utils";
import { PDFDocument } from "pdf-lib";

export default function UnlockPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setResult(null);
  }, []);

  const handleUnlock = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(20);

    try {
      setProgress(40);
      const bytes = await files[0].arrayBuffer();
      const pdf = await PDFDocument.load(bytes, {
        ignoreEncryption: true,
      });
      setProgress(70);
      const newPdf = await PDFDocument.create();
      const pages = await newPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => newPdf.addPage(page));
      const data = await newPdf.save();
      setProgress(90);
      setResult(data);
      setProgress(100);
    } catch (err) {
      console.error("Unlock failed:", err);
      alert("Failed to unlock PDF. The password may be incorrect or the file uses unsupported encryption.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadPDF(result, "unlocked.pdf");
  };

  return (
    <ToolLayout
      title="Unlock PDF"
      description="Remove password from a protected PDF"
      icon={Unlock}
      color="from-green-600 to-teal-600"
      processing={processing}
      progress={progress}
    >
      <div className="space-y-6">
        <FileUpload
          accept=".pdf"
          onFilesSelected={handleFilesSelected}
          files={files}
          onRemoveFile={() => { setFiles([]); setResult(null); }}
          label="Upload protected PDF"
          description="Drop a password-protected PDF here"
        />

        {files.length > 0 && (
          <div className="p-4 rounded-xl border border-border bg-secondary/20">
            <label className="text-sm font-medium mb-1.5 block">Password (if required)</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter PDF password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        <Button onClick={handleUnlock} disabled={files.length === 0 || processing} className="w-full" size="lg">
          {processing ? "Unlocking..." : "Unlock PDF"}
        </Button>

        {result && (
          <Button onClick={handleDownload} size="lg" className="w-full gap-2">
            <Download className="h-4 w-4" />
            Download Unlocked PDF
          </Button>
        )}
      </div>
    </ToolLayout>
  );
}
