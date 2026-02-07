"use client";

import {
  MousePointer,
  Type,
  Square,
  ImagePlus,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Download,
  Trash2,
  Highlighter,
  PenTool,
  Edit3,
  Grid3X3,
  Maximize2,
  Circle,
  Minus,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EditorTool } from "@/lib/pdf-editor/types";

interface ToolbarProps {
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onDelete: () => void;
  canDelete: boolean;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onExport: () => void;
  exporting: boolean;
  precisionMode: boolean;
  onPrecisionToggle: () => void;
  onImageUpload: () => void;
  hasEdits: boolean;
}

interface ToolDef {
  id: EditorTool;
  icon: typeof MousePointer;
  label: string;
  shortcut?: string;
}

const tools: ToolDef[] = [
  { id: "select", icon: MousePointer, label: "Select", shortcut: "V" },
  { id: "edit-text", icon: Edit3, label: "Edit Text", shortcut: "T" },
  { id: "add-text", icon: Type, label: "Add Text" },
  { id: "highlight", icon: Highlighter, label: "Highlight", shortcut: "H" },
  { id: "draw", icon: PenTool, label: "Draw", shortcut: "D" },
  { id: "shape", icon: Square, label: "Shape" },
  { id: "whiteout", icon: Square, label: "Whiteout", shortcut: "W" },
  { id: "image", icon: ImagePlus, label: "Image" },
];

export function Toolbar({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onDelete,
  canDelete,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onExport,
  exporting,
  precisionMode,
  onPrecisionToggle,
  onImageUpload,
  hasEdits,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-border bg-card shadow-sm">
      {/* Tool buttons */}
      <div className="flex items-center gap-0.5 border-r border-border pr-1.5">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-8 px-2 gap-1 text-xs",
              activeTool === tool.id && "gradient-primary"
            )}
            onClick={() => {
              if (tool.id === "image") {
                onImageUpload();
              } else {
                onToolChange(tool.id);
              }
            }}
            title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ""}`}
          >
            <tool.icon className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{tool.label}</span>
          </Button>
        ))}
      </div>

      {/* Undo/Redo/Delete */}
      <div className="flex items-center gap-0.5 border-r border-border pr-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive"
            onClick={onDelete}
            title="Delete (Del)"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Zoom */}
      <div className="flex items-center gap-0.5 border-r border-border pr-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onZoomOut}
          title="Zoom out (-)"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs w-10 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onZoomIn}
          title="Zoom in (+)"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onZoomFit}
          title="Fit to width"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Precision mode */}
      <div className="flex items-center gap-0.5 border-r border-border pr-1.5">
        <Button
          variant={precisionMode ? "default" : "ghost"}
          size="sm"
          className={cn("h-8 px-2 gap-1 text-xs", precisionMode && "bg-amber-500/20 text-amber-700 dark:text-amber-300")}
          onClick={onPrecisionToggle}
          title="Precision Mode - show block boxes and baselines"
        >
          <Grid3X3 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Precision</span>
        </Button>
      </div>

      {/* Export */}
      <Button
        onClick={onExport}
        size="sm"
        className="h-8 gap-1.5 ml-auto gradient-primary"
        disabled={exporting || !hasEdits}
        title="Export edited PDF"
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Export PDF</span>
      </Button>
    </div>
  );
}

// ─── Shape Sub-toolbar ───

export function ShapeSubToolbar({
  activeShape,
  onShapeChange,
}: {
  activeShape: "rectangle" | "ellipse" | "line";
  onShapeChange: (shape: "rectangle" | "ellipse" | "line") => void;
}) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-card/80">
      <Button
        variant={activeShape === "rectangle" ? "default" : "ghost"}
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => onShapeChange("rectangle")}
        title="Rectangle"
      >
        <Square className="h-3 w-3" />
      </Button>
      <Button
        variant={activeShape === "ellipse" ? "default" : "ghost"}
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => onShapeChange("ellipse")}
        title="Ellipse"
      >
        <Circle className="h-3 w-3" />
      </Button>
      <Button
        variant={activeShape === "line" ? "default" : "ghost"}
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => onShapeChange("line")}
        title="Line"
      >
        <Minus className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ─── How It Works Tooltip ───

export function HowItWorksTooltip() {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg border border-border bg-card/50 text-xs text-muted-foreground">
      <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
      <div>
        <p className="font-medium text-foreground mb-1">How it works</p>
        <p>
          Click any text on the PDF to select it. Double-click to edit in place.
          Your changes match the original font, size, and color.
          On export, edits are embedded directly into the PDF structure &mdash;
          not as visible overlays. <strong>Your files never leave your browser.</strong>
        </p>
      </div>
    </div>
  );
}
