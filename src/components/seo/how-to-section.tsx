interface HowToSectionProps {
  title: string;
  steps: { step: string; description: string }[];
}

export function HowToSection({ title, steps }: HowToSectionProps) {
  return (
    <section className="mt-12 mb-8">
      <h2 className="text-xl font-bold mb-6">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((s, idx) => (
          <div
            key={idx}
            className="relative rounded-xl border border-border p-5 bg-card"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-white text-sm font-bold">
                {idx + 1}
              </div>
              <h3 className="font-semibold text-sm">{s.step}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {s.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
