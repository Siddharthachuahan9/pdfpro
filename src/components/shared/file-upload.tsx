"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, FileText, X, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatFileSize } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onFilesSelected: (files: File[]) => void;
  files: File[];
  onRemoveFile?: (index: number) => void;
  label?: string;
  description?: string;
}

export function FileUpload({
  accept = ".pdf",
  multiple = false,
  maxSize = 100 * 1024 * 1024,
  onFilesSelected,
  files,
  onRemoveFile,
  label = "Upload your files",
  description = "Drag and drop or click to browse",
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const arr = Array.from(fileList).filter((f) => f.size <= maxSize);
      if (arr.length > 0) {
        onFilesSelected(multiple ? [...files, ...arr] : arr);
      }
    },
    [files, maxSize, multiple, onFilesSelected]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className="w-full">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center w-full min-h-[200px] rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-accent/50",
          files.length > 0 && "min-h-[120px]"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <Upload
          className={cn(
            "h-10 w-10 mb-3 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground"
          )}
        />
        <p className="font-medium text-sm mb-1">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Max {formatFileSize(maxSize)} per file
        </p>
      </div>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            {files.map((file, idx) => (
              <motion.div
                key={`${file.name}-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                {onRemoveFile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(idx);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
