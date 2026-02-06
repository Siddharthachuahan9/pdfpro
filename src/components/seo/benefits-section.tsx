import { CheckCircle2 } from "lucide-react";

interface BenefitsSectionProps {
  benefits: string[];
}

export function BenefitsSection({ benefits }: BenefitsSectionProps) {
  return (
    <section className="mt-8 mb-8">
      <h2 className="text-xl font-bold mb-4">Why Use This Tool?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {benefits.map((benefit, idx) => (
          <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            <span className="text-sm text-muted-foreground">{benefit}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
