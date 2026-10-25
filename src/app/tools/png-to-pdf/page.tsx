"use client";

import { ImagePlus } from "lucide-react";
import { ImageToPDFTool } from "@/components/shared/image-to-pdf-tool";

export default function PNGToPDFPage() {
  return (
    <ImageToPDFTool
      toolId="png-to-pdf"
      title="PNG to PDF"
      description="Convert PNG images to a PDF document"
      icon={ImagePlus}
      color="from-teal-500 to-cyan-500"
      accept=".png"
      kind="PNG"
    />
  );
}
