"use client";

import { getToolSEO } from "@/lib/seo-data";
import { ToolIntro } from "./tool-intro";
import { HowToSection } from "./how-to-section";
import { BenefitsSection } from "./benefits-section";
import { FAQSection } from "./faq-section";
import { RelatedTools } from "./related-tools";

interface ToolSEOContentProps {
  toolId: string;
  toolName: string;
}

export function ToolSEOContent({ toolId, toolName }: ToolSEOContentProps) {
  const seo = getToolSEO(toolId);
  if (!seo) return null;

  return (
    <div className="mt-12 border-t border-border pt-8">
      <ToolIntro paragraph={seo.introParagraph} />
      <HowToSection title={seo.h2Intro} steps={seo.howToSteps} />
      <BenefitsSection benefits={seo.benefits} />
      <FAQSection faqs={seo.faqs} />
      <RelatedTools toolIds={seo.relatedTools} currentToolName={toolName} />
    </div>
  );
}
