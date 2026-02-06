"use client";

import { useState, useCallback } from "react";
import { Lock, Download, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { protectPDF } from "@/lib/pdf/pdf-utils";
import { downloadPDF } from "@/lib/utils";
import { ToolSEOContent } from "@/components/seo/tool-seo-content";

export default function ProtectPDFPage() {
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

  const handleProtect = async () => {
    if (files.length === 0 || !password) return;
    setProcessing(true);
    setProgress(20);

    try {
      setProgress(50);
      const data = await protectPDF(files[0]);
      setProgress(90);
      setResult(data);
      setProgress(100);
    } catch (err) {
      console.error("Protect failed:", err);
      alert("Failed to protect PDF.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadPDF(result, "protected.pdf");
  };

  return (
    <ToolLayout
      title="Protect PDF"
      description="Add password protection to your PDF"
      icon={Lock}
      color="from-red-600 to-orange-600"
      processing={processing}
      progress={progress}
    >
      <div className="space-y-6">
        <FileUpload
          accept=".pdf"
          onFilesSelected={handleFilesSelected}
          files={files}
          onRemoveFile={() => { setFiles([]); setResult(null); }}
          label="Upload PDF"
          description="Drop a PDF file here"
        />

        {files.length > 0 && (
          <div className="p-4 rounded-xl border border-border bg-secondary/20">
            <label className="text-sm font-medium mb-1.5 block">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Note: Browser-based encryption has limitations. For maximum security, use desktop tools.
            </p>
          </div>
        )}

        <Button onClick={handleProtect} disabled={files.length === 0 || !password || processing} className="w-full" size="lg">
          {processing ? "Protecting..." : "Protect PDF"}
        </Button>

        {result && (
          <Button onClick={handleDownload} size="lg" className="w-full gap-2">
            <Download className="h-4 w-4" />
            Download Protected PDF
          </Button>
        )}
      </div>
      <ToolSEOContent toolId="protect-pdf" toolName="Protect PDF" />
    </ToolLayout>
  );
}
