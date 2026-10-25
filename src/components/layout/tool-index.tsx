import Link from "next/link";
import { toolGroups, type ToolEntry } from "./tool-groups";

/** The 20 tools in three columns: Organise | Convert | Edit and sign, Secure, Other. */
const columns = [["Organise"], ["Convert"], ["Edit and sign", "Secure", "Other"]];

export function ToolIndex({ only }: { only?: Set<string> }) {
  let i = 0;
  const visible = (t: ToolEntry) => !only || only.has(t.id);
  return (
    <div className="tools__cols">
      {columns.map((names) => (
        <div key={names[0]}>
          {names.map((name) => {
            const group = toolGroups.find((g) => g.name === name);
            const items = group ? group.tools.filter(visible) : [];
            if (!items.length) return null;
            return (
              <div className="group" key={name}>
                <h3>{name}</h3>
                <ul>
                  {items.map((t) => (
                    <li key={t.id}>
                      <Link className="tool" href={t.href} style={{ "--i": ++i } as React.CSSProperties}>
                        <b>{t.name}</b>
                        <span>{t.blurb}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
