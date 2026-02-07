"use client";

import { useState } from "react";
import {
  RotateCw,
  Trash2,
  Copy,
  GripVertical,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PageData } from "@/lib/pdf-editor/types";

interface ThumbnailsProps {
  pages: PageData[];
  currentPage: number;
  onPageSelect: (index: number) => void;
  onPageRotate: (index: number) => void;
  onPageDelete: (index: number) => void;
  onPageDuplicate: (index: number) => void;
  onPageReorder: (fromIndex: number, toIndex: number) => void;
}

export function Thumbnails({
  pages,
  currentPage,
  onPageSelect,
  onPageRotate,
  onPageDelete,
  onPageDuplicate,
  onPageReorder,
}: ThumbnailsProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex !== null && dragIndex !== index) {
      onPageReorder(dragIndex, index);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="text-xs font-medium text-muted-foreground px-1 mb-1">
        Pages ({pages.length})
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
        {pages.map((page, idx) => (
          <div
            key={idx}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={handleDragEnd}
            className={cn(
              "group relative flex flex-col items-center rounded-lg border-2 cursor-pointer transition-all",
              currentPage === idx
                ? "border-primary bg-primary/5"
                : "border-transparent hover:border-border",
              dragOverIndex === idx && "border-primary/50 bg-primary/10",
              dragIndex === idx && "opacity-50"
            )}
            onClick={() => onPageSelect(idx)}
          >
            {/* Drag handle */}
            <div className="absolute top-0.5 left-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
              <GripVertical className="h-3 w-3 text-muted-foreground" />
            </div>

            {/* Thumbnail image */}
            <div className="relative w-full aspect-[0.707] overflow-hidden rounded-md bg-white">
              <img
                src={page.imageDataUrl}
                alt={`Page ${idx + 1}`}
                className="w-full h-full object-contain"
                draggable={false}
              />
              {/* Scanned indicator */}
              {page.isScanned && (
                <div className="absolute top-0.5 right-0.5">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                </div>
              )}
            </div>

            {/* Page number */}
            <span className="text-[10px] text-muted-foreground py-0.5">
              {idx + 1}
            </span>

            {/* Action buttons (visible on hover) */}
            <div className="absolute bottom-5 right-0.5 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 bg-background/80 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPageRotate(idx);
                }}
                title="Rotate"
              >
                <RotateCw className="h-2.5 w-2.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 bg-background/80 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPageDuplicate(idx);
                }}
                title="Duplicate"
              >
                <Copy className="h-2.5 w-2.5" />
              </Button>
              {pages.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 bg-background/80 backdrop-blur-sm text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPageDelete(idx);
                  }}
                  title="Delete"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
