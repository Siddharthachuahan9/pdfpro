"use client";

import { useState, useCallback } from "react";
import { Hash, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { addPageNumbers } from "@/lib/pdf/pdf-utils";
import { downloadPDF } from "@/lib/utils";

export default function AddPageNumbersPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [position, setPosition] = useState<"bottom-center" | "bottom-left" | "bottom-right" | "top-center" | "top-left" | "top-right">("bottom-center");
  const [startFrom, setStartFrom] = useState(1);
  const [fontSize, setFontSize] = useState(12);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setResult(null);
  }, []);

  const handleProcess = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(20);

    try {
      setProgress(50);
      const data = await addPageNumbers(files[0], { position, startFrom, fontSize });
      setProgress(90);
      setResult(data);
      setProgress(100);
    } catch (err) {
      console.error("Failed:", err);
      alert("Failed to add page numbers.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadPDF(result, "numbered.pdf");
  };

  return (
    <ToolLayout
      title="Add Page Numbers"
      description="Add page numbers to your PDF"
      icon={Hash}
      color="from-emerald-500 to-green-600"
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
          <div className="space-y-4 p-4 rounded-xl border border-border bg-secondary/20">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Position</label>
              <Select value={position} onValueChange={(v: typeof position) => setPosition(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-center">Bottom Center</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="top-center">Top Center</SelectItem>
                  <SelectItem value="top-left">Top Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Start From</label>
                <Input type="number" value={startFrom} onChange={(e) => setStartFrom(parseInt(e.target.value) || 1)} min={1} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Font Size</label>
                <Input type="number" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value) || 12)} min={8} max={36} />
              </div>
            </div>
          </div>
        )}

        <Button onClick={handleProcess} disabled={files.length === 0 || processing} className="w-full" size="lg">
          {processing ? "Processing..." : "Add Page Numbers"}
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
