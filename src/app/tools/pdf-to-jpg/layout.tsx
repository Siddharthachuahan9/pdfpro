import { generateToolMetadata } from "@/lib/tool-metadata";
import { getToolSEO } from "@/lib/seo-data";
import { getToolFAQSchema, getHowToSchema, getBreadcrumbSchema } from "@/lib/schemas";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata = generateToolMetadata("pdf-to-jpg");

export default function Layout({ children }: { children: React.ReactNode }) {
  const seo = getToolSEO("pdf-to-jpg")!;
  return (
    <>
      <JsonLd data={getToolFAQSchema(seo.faqs)} />
      <JsonLd data={getHowToSchema(seo.h1, seo.metaDescription, seo.howToSteps)} />
      <JsonLd data={getBreadcrumbSchema([
        { name: "Home", url: "https://pdfkit.pro" },
        { name: "Tools", url: "https://pdfkit.pro/tools" },
        { name: "PDF to JPG", url: "https://pdfkit.pro/tools/pdf-to-jpg" },
      ])} />
      {children}
    </>
  );
}
