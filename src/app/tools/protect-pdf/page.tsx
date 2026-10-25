"use client";

import { useState, useCallback } from "react";
import { Lock, Download, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { encryptPDF, ENCRYPTION_LABEL } from "@/lib/pdf/encryption";
import { downloadPDF } from "@/lib/utils";
import { ToolSEOContent } from "@/components/seo/tool-seo-content";

export default function ProtectPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && password !== confirm;
  const canProtect = files.length > 0 && password.length > 0 && password === confirm && !processing;

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setResult(null);
    setError(null);
  }, []);

  const handleProtect = async () => {
    if (!canProtect) return;
    setProcessing(true);
    setError(null);
    setResult(null);
    setProgress(30);

    try {
      const data = await encryptPDF(files[0], password);
      setProgress(100);
      setResult(data);
    } catch (err) {
      console.error("Protect failed:", err);
      setError(err instanceof Error ? err.message : "Failed to protect PDF.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const base = files[0]?.name.replace(/\.pdf$/i, "") || "document";
    downloadPDF(result, `${base}-protected.pdf`);
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
          onRemoveFile={() => { setFiles([]); setResult(null); setError(null); }}
          label="Upload PDF"
          description="Drop a PDF file here"
        />

        {files.length > 0 && (
          <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
            <div>
              <label htmlFor="pdf-password" className="text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Input
                  id="pdf-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setResult(null); }}
                  placeholder="Enter password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="pdf-password-confirm" className="text-sm font-medium mb-1.5 block">Confirm password</label>
              <Input
                id="pdf-password-confirm"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setResult(null); }}
                placeholder="Type the password again"
                autoComplete="new-password"
                aria-invalid={mismatch}
              />
              {mismatch && (
                <p className="text-xs text-destructive mt-1.5" role="alert">Passwords don&apos;t match.</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              The PDF is encrypted with {ENCRYPTION_LABEL} in your browser. Anyone opening it will need this
              password. There is no way to recover the file if you forget it.
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive text-center" role="alert">{error}</p>
        )}

        <Button onClick={handleProtect} disabled={!canProtect} className="w-full" size="lg">
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
