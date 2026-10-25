import type { Metadata } from "next";
import { toolCount } from "@/components/layout/tool-groups";
import { ToolsBrowser } from "@/components/layout/tools-browser";

export const metadata: Metadata = {
  title: "All PDF tools",
  description: "Every pdfkit.pro tool on one page: merge, split, convert, edit, sign and more. Free, and your files stay in your browser.",
  alternates: { canonical: "https://pdfkit.pro/tools" },
};

export default function ToolsPage() {
  return (
    <div className="wrap">
      <div className="doc__head" style={{ paddingTop: 40 }}>
        <h1>All {toolCount} tools</h1>
        <p>Pick one. Each runs in this browser tab, so your files are not uploaded.</p>
      </div>
      <ToolsBrowser />
    </div>
  );
}
