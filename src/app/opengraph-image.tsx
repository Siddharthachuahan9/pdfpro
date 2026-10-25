import { ImageResponse } from "next/og";

export const alt = "pdfkit.pro — 20 free PDF tools that run in your browser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "#0b0b0f",
          color: "#f5f5f7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -2 }}>pdfkit.pro</div>
        <div style={{ fontSize: 48, marginTop: 24, color: "#c7c7d1", lineHeight: 1.25 }}>
          20 free PDF tools that run in your browser
        </div>
        <div style={{ fontSize: 28, marginTop: 48, color: "#8b8b98" }}>
          Merge · Split · Compress · Edit · Sign · Convert
        </div>
      </div>
    ),
    size
  );
}
