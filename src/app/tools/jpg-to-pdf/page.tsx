"use client";

import { FileImage } from "lucide-react";
import { ImageToPDFTool } from "@/components/shared/image-to-pdf-tool";

export default function JPGToPDFPage() {
  return (
    <ImageToPDFTool
      toolId="jpg-to-pdf"
      title="JPG to PDF"
      description="Convert JPG images to a PDF document"
      icon={FileImage}
      color="from-pink-500 to-rose-500"
      accept=".jpg,.jpeg"
      kind="JPG"
    />
  );
}
