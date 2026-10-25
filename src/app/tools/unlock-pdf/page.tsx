"use client";

import { useState, useCallback } from "react";
import { Unlock, Download, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { downloadPDF } from "@/lib/utils";
import { decryptPDF, inspectEncryption } from "@/lib/pdf/encryption";
import { ToolSEOContent } from "@/components/seo/tool-seo-content";

type Status = { encrypted: boolean; needsPassword: boolean } | null;

export default function UnlockPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);

  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    setFiles(newFiles);
    setResult(null);
    setError(null);
    setStatus(null);
    if (newFiles.length === 0) return;
    try {
      const s = await inspectEncryption(newFiles[0]);
      setStatus(s);
      if (!s.encrypted) setError("This PDF is not password-protected.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "This file couldn't be read as a PDF.");
    }
  }, []);

  const handleUnlock = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setError(null);
    setResult(null);
    setProgress(30);

    try {
      const data = await decryptPDF(files[0], password);
      setProgress(100);
      setResult(data);
    } catch (err) {
      console.error("Unlock failed:", err);
      setError(err instanceof Error ? err.message : "Failed to unlock PDF.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const base = files[0]?.name.replace(/\.pdf$/i, "") || "document";
    downloadPDF(result, `${base}-unlocked.pdf`);
  };

  const needsPassword = status?.needsPassword ?? true;
  const notEncrypted = status !== null && !status.encrypted;

  return (
    <ToolLayout
      title="Unlock PDF"
      description="Remove the password from a PDF you can open"
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
          onRemoveFile={() => { setFiles([]); setResult(null); setError(null); setStatus(null); }}
          label="Upload protected PDF"
          description="Drop a password-protected PDF here"
        />

        {files.length > 0 && status?.encrypted && !needsPassword && (
          <p className="text-sm text-muted-foreground text-center">
            This PDF opens without a password but has editing or printing restrictions. Unlocking removes them.
          </p>
        )}

        {files.length > 0 && needsPassword && !notEncrypted && (
          <div className="p-4 rounded-xl border border-border bg-secondary/20">
            <label htmlFor="unlock-password" className="text-sm font-medium mb-1.5 block">Password</label>
            <div className="relative">
              <Input
                id="unlock-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
                placeholder="Enter the password used to open this PDF"
                autoComplete="current-password"
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
            <p className="text-xs text-muted-foreground mt-2">
              You need the password. This tool removes protection from files you can already open; it does not crack passwords.
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive text-center" role="alert">{error}</p>
        )}

        <Button
          onClick={handleUnlock}
          disabled={files.length === 0 || processing || notEncrypted || (needsPassword && !password)}
          className="w-full"
          size="lg"
        >
          {processing ? "Unlocking..." : "Unlock PDF"}
        </Button>

        {result && (
          <Button onClick={handleDownload} size="lg" className="w-full gap-2">
            <Download className="h-4 w-4" />
            Download Unlocked PDF
          </Button>
        )}
      </div>
      <ToolSEOContent toolId="unlock-pdf" toolName="Unlock PDF" />
    </ToolLayout>
  );
}
