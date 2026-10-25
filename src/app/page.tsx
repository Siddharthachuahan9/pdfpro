import { ToolIndex } from "@/components/layout/tool-index";
import { toolCount } from "@/components/layout/tool-groups";
import { MergePanel } from "@/components/home/merge-panel";
import { Questions, type QA } from "@/components/home/questions";

const questions: QA[] = [
  {
    q: "Are my files uploaded anywhere?",
    a: "No. Every tool opens your files inside this browser tab and writes the result there. Files never leave your device. The site counts page views with Vercel Analytics.",
  },
  {
    q: "Is it really free?",
    a: "Yes. There is no account, no trial and no paid tier. Every tool listed here is free to use.",
  },
  {
    q: "Is Chat with PDF an AI?",
    a: "No. It searches the text of your PDF for the words you type and shows the passages that match.",
  },
  {
    q: "Can it read scanned documents?",
    a: "Not yet. Extract Text and PDF to Word read the text a PDF already contains. A scan that is only a picture of a page has none.",
  },
  {
    q: "How much does Compress save?",
    a: "Usually a little. It re-saves the file and tidies its structure, so expect small savings rather than a much smaller file.",
  },
];

export default function Home() {
  return (
    <div className="wrap">
      <section className="hero" aria-labelledby="h1">
        <div className="hero__title">
          <h1 id="h1">pdfkit.pro</h1>
          <p className="lead">Free PDF tools that run in your browser. Your files never leave your device.</p>
        </div>

        <nav className="tools" aria-labelledby="tools-h">
          <h2 id="tools-h">All {toolCount} tools</h2>
          <ToolIndex />
        </nav>

        <div className="slot" style={{ "--i": 4 } as React.CSSProperties}>
          <MergePanel />
        </div>
      </section>

      <section className="how" id="how" aria-labelledby="how-h">
        <h2 id="how-h">
          How it works
        </h2>
        <ol>
          <li>Pick a tool and choose files from this device.</li>
          <li>
            The tool does the work inside this browser tab, using open libraries such as pdf-lib and PDF.js.
          </li>
          <li>Save the result. Nothing was uploaded, so there is nothing to delete.</li>
        </ol>
      </section>

      <Questions items={questions} />
    </div>
  );
}
