interface ToolIntroProps {
  paragraph: string;
}

export function ToolIntro({ paragraph }: ToolIntroProps) {
  return (
    <div className="mb-8 max-w-3xl">
      <p className="text-sm text-muted-foreground leading-relaxed">
        {paragraph}
      </p>
    </div>
  );
}
