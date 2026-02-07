"use client";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";
import type { TextBlock } from "@/lib/pdf-editor/types";

interface PropertiesPanelProps {
  selectedBlock: TextBlock | null;
  autoFitEnabled: boolean;
  onAutoFitToggle: (enabled: boolean) => void;
  onFontSizeChange: (size: number) => void;
  onColorChange: (color: string) => void;
  onLetterSpacingChange: (spacing: number) => void;
  onOpacityChange: (opacity: number) => void;
  onBackgroundColorChange: (color: string) => void;
  onResetBlock: () => void;
  fitWarning: boolean;
}

export function PropertiesPanel({
  selectedBlock,
  autoFitEnabled,
  onAutoFitToggle,
  onFontSizeChange,
  onColorChange,
  onLetterSpacingChange,
  onOpacityChange,
  onBackgroundColorChange,
  onResetBlock,
  fitWarning,
}: PropertiesPanelProps) {
  if (!selectedBlock) {
    return (
      <div className="flex flex-col gap-3 p-3">
        <div className="text-xs font-medium text-muted-foreground">Properties</div>
        <p className="text-xs text-muted-foreground/70">
          Select a text block to view and edit its properties.
        </p>
        <div className="space-y-2 mt-4">
          <div className="text-xs font-medium text-muted-foreground">Keyboard Shortcuts</div>
          <div className="space-y-1">
            {[
              ["V", "Select mode"],
              ["T", "Edit text mode"],
              ["H", "Highlight"],
              ["D", "Draw"],
              ["W", "Whiteout"],
              ["Esc", "Exit edit / deselect"],
              ["Del", "Delete selected"],
              ["Ctrl+Z", "Undo"],
              ["Ctrl+Shift+Z", "Redo"],
              ["+/-", "Zoom in/out"],
              ["0", "Fit to width"],
            ].map(([key, desc]) => (
              <div key={key} className="flex justify-between text-[10px]">
                <kbd className="px-1 rounded bg-muted font-mono">{key}</kbd>
                <span className="text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="text-xs font-medium text-muted-foreground">
        Text Block Properties
      </div>

      {/* Font info (read-only) */}
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Font</label>
        <div className="text-xs truncate">{selectedBlock.fontFamily.split(",")[0]}</div>
        <div className="text-[10px] text-muted-foreground">
          {selectedBlock.fontWeight} {selectedBlock.fontStyle}
        </div>
      </div>

      {/* Font size */}
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Size
        </label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={Math.round(selectedBlock.adjustedFontSize * 10) / 10}
            onChange={(e) => onFontSizeChange(parseFloat(e.target.value) || selectedBlock.screenFontSize)}
            className="h-7 w-16 text-xs"
            min={4}
            max={200}
            step={0.5}
          />
          <span className="text-[10px] text-muted-foreground">px</span>
        </div>
      </div>

      {/* Color */}
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Text Color
        </label>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={selectedBlock.color}
            onChange={(e) => onColorChange(e.target.value)}
            className="h-7 w-7 p-0.5 rounded cursor-pointer"
          />
          <Input
            type="text"
            value={selectedBlock.color}
            onChange={(e) => onColorChange(e.target.value)}
            className="h-7 flex-1 text-xs font-mono"
          />
        </div>
      </div>

      {/* Letter spacing */}
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Letter Spacing
        </label>
        <div className="flex items-center gap-2">
          <Slider
            value={[selectedBlock.adjustedLetterSpacing]}
            onValueChange={([v]) => onLetterSpacingChange(v)}
            min={-3}
            max={5}
            step={0.1}
            className="flex-1"
          />
          <span className="text-[10px] w-10 text-right tabular-nums">
            {selectedBlock.adjustedLetterSpacing.toFixed(1)}px
          </span>
        </div>
      </div>

      {/* Opacity */}
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Opacity
        </label>
        <div className="flex items-center gap-2">
          <Slider
            value={[selectedBlock.opacity * 100]}
            onValueChange={([v]) => onOpacityChange(v / 100)}
            min={10}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-[10px] w-10 text-right tabular-nums">
            {Math.round(selectedBlock.opacity * 100)}%
          </span>
        </div>
      </div>

      {/* Background sample color */}
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Background Fill
        </label>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={selectedBlock.backgroundColor}
            onChange={(e) => onBackgroundColorChange(e.target.value)}
            className="h-7 w-7 p-0.5 rounded cursor-pointer"
          />
          <span className="text-[10px] text-muted-foreground">
            Used to cover original text
          </span>
        </div>
      </div>

      {/* Auto-fit toggle */}
      <div className="flex items-center justify-between py-1">
        <div>
          <div className="text-xs font-medium">Auto-fit</div>
          <div className="text-[10px] text-muted-foreground">
            Adjust to fit original box
          </div>
        </div>
        <Switch
          checked={autoFitEnabled}
          onCheckedChange={onAutoFitToggle}
        />
      </div>

      {/* Fit warning */}
      {fitWarning && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[10px] text-amber-700 dark:text-amber-300">
            Text exceeds the original bounding box. Consider shortening the text or disabling auto-fit for manual adjustment.
          </p>
        </div>
      )}

      {/* Reset */}
      {selectedBlock.isEdited && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={onResetBlock}
        >
          <RotateCcw className="h-3 w-3" />
          Reset to Original
        </Button>
      )}

      {/* Block info */}
      <div className="mt-2 pt-2 border-t border-border">
        <div className="text-[10px] text-muted-foreground space-y-0.5">
          <div>Original: &ldquo;{selectedBlock.text.slice(0, 40)}{selectedBlock.text.length > 40 ? "..." : ""}&rdquo;</div>
          <div>Position: ({Math.round(selectedBlock.pdfX)}, {Math.round(selectedBlock.pdfY)})</div>
          <div>Rotation: {Math.round(selectedBlock.rotation)}°</div>
          <div>Items merged: {selectedBlock.itemCount}</div>
        </div>
      </div>
    </div>
  );
}
