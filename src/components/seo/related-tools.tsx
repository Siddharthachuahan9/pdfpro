import Link from "next/link";
import { tools } from "@/lib/tools-data";

interface RelatedToolsProps {
  toolIds: string[];
  currentToolName: string;
}

export function RelatedTools({ toolIds, currentToolName }: RelatedToolsProps) {
  const relatedTools = toolIds
    .map((id) => tools.find((t) => t.id === id))
    .filter(Boolean);

  if (relatedTools.length === 0) return null;

  return (
    <section className="mt-12 mb-8">
      <h2 className="text-xl font-bold mb-2">People Also Use</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Other tools frequently used alongside {currentToolName}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {relatedTools.map((tool) => {
          if (!tool) return null;
          return (
            <Link key={tool.id} href={tool.href}>
              <div className="group rounded-xl border border-border p-4 hover:border-primary/50 hover:shadow-md transition-all duration-200 bg-card">
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${tool.color} mb-2.5`}>
                  <tool.icon className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm font-medium group-hover:text-primary transition-colors">
                  {tool.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {tool.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
