"use client";

import { useState } from "react";

export interface QA {
  q: string;
  a: string;
}

/**
 * Questions as an index; on a wide screen the chosen answer sits in the pane beside it,
 * on a phone it opens under its question.
 */
export function Questions({ items }: { items: QA[] }) {
  const [cur, setCur] = useState(0);
  const [openInline, setOpenInline] = useState(true);
  const narrow = () => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;

  const pick = (i: number, fromClick: boolean) => {
    if (fromClick && narrow() && i === cur) {
      setOpenInline((o) => !o);
      return;
    }
    setCur(i);
    setOpenInline(true);
  };

  return (
    <section className="faq" id="questions" aria-labelledby="faq-h">
      <div className="faq__list">
        <h2 id="faq-h">
          Common questions
        </h2>
        {items.map((it, i) => (
          <div key={it.q}>
            <button
              className="q"
              type="button"
              aria-expanded={i === cur && openInline}
              onClick={() => pick(i, true)}
              onFocus={() => {
                if (!narrow()) pick(i, false);
              }}
              onPointerEnter={() => {
                if (!narrow() && i !== cur) pick(i, false);
              }}
            >
              {it.q}
            </button>
            <p className="a-inline" hidden={!(i === cur && openInline)}>
              {it.a}
            </p>
          </div>
        ))}
      </div>
      <div className="pane" aria-live="polite">
        <p>{items[cur]?.a}</p>
      </div>
    </section>
  );
}
