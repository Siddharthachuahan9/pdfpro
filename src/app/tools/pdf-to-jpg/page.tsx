"use client";

import { useState, useCallback } from "react";
import { Image, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { pdfToImages } from "@/lib/pdf/pdf-render";
import { ToolSEOContent } from "@/components/seo/tool-seo-content";

export default function PDFToJPGPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [images, setImages] = useState<{ data: string; filename: string }[]>([]);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    setImages([]);
  }, []);

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(20);

    try {
      const results = await pdfToImages(files[0], "jpeg", 0.9, 2.0);
      setImages(results);
      setProgress(100);
    } catch (err) {
      console.error("Conversion failed:", err);
      alert("Failed to convert PDF to images.");
    } finally {
      setProcessing(false);
    }
  };

  const downloadImage = (img: { data: string; filename: string }) => {
    const a = document.createElement("a");
    a.href = img.data;
    a.download = img.filename;
    a.click();
  };

  const downloadAll = () => {
    images.forEach((img) => downloadImage(img));
  };

  return (
    <ToolLayout
      title="PDF to JPG"
      description="Convert PDF pages to JPG images"
      icon={Image}
      color="from-orange-500 to-amber-500"
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
            setImages([]);
          }}
          label="Upload PDF to convert"
          description="Drop a PDF file here"
        />

        <Button
          onClick={handleConvert}
          disabled={files.length === 0 || processing}
          className="w-full"
          size="lg"
        >
          {processing ? "Converting..." : "Convert to JPG"}
        </Button>

        {images.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{images.length} image(s) created</p>
              <Button variant="outline" size="sm" onClick={downloadAll} className="gap-1">
                <Download className="h-3.5 w-3.5" />
                Download All
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="group relative rounded-lg overflow-hidden border border-border cursor-pointer"
                  onClick={() => downloadImage(img)}
                >
                  <img
                    src={img.data}
                    alt={img.filename}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <Download className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-center py-1 text-muted-foreground">
                    {img.filename}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <ToolSEOContent toolId="pdf-to-jpg" toolName="PDF to JPG" />
    </ToolLayout>
  );
}
