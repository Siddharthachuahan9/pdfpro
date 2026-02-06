"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MessageSquareText, Send, FileText, Loader2, Sparkles, Copy, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolLayout } from "@/components/shared/tool-layout";
import { FileUpload } from "@/components/shared/file-upload";
import { extractTextFromPDF } from "@/lib/pdf/pdf-render";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface PageContent {
  pageNum: number;
  text: string;
}

function searchInPages(pages: PageContent[], query: string): { pageNum: number; snippet: string }[] {
  const q = query.toLowerCase();
  const results: { pageNum: number; snippet: string }[] = [];

  for (const page of pages) {
    const lower = page.text.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx !== -1) {
      const start = Math.max(0, idx - 80);
      const end = Math.min(page.text.length, idx + q.length + 80);
      let snippet = page.text.slice(start, end).trim();
      if (start > 0) snippet = "..." + snippet;
      if (end < page.text.length) snippet = snippet + "...";
      results.push({ pageNum: page.pageNum, snippet });
    }
  }
  return results;
}

function generateAnswer(pages: PageContent[], question: string): string {
  const q = question.toLowerCase().trim();
  const totalPages = pages.length;
  const fullText = pages.map((p) => p.text).join(" ");
  const totalWords = fullText.split(/\s+/).filter(Boolean).length;
  const totalChars = fullText.length;

  // Meta questions about the document
  if (q.match(/how many pages|page count|total pages|number of pages/)) {
    return `This PDF has **${totalPages} page${totalPages !== 1 ? "s" : ""}**.`;
  }

  if (q.match(/how many words|word count|total words/)) {
    return `This PDF contains approximately **${totalWords.toLocaleString()} words** across ${totalPages} page${totalPages !== 1 ? "s" : ""}.`;
  }

  if (q.match(/how many characters|character count|total characters/)) {
    return `This PDF contains approximately **${totalChars.toLocaleString()} characters**.`;
  }

  if (q.match(/summarize|summary|what is this|what's this|about this|overview|describe/)) {
    const firstPage = pages[0]?.text || "";
    const preview = firstPage.slice(0, 500).trim();
    let response = `**Document Summary**\n\nThis is a ${totalPages}-page PDF with approximately ${totalWords.toLocaleString()} words.\n\n`;
    response += `**First page preview:**\n\n> ${preview}${firstPage.length > 500 ? "..." : ""}`;
    return response;
  }

  if (q.match(/table of contents|toc|headings|sections|chapters/)) {
    // Try to find lines that look like headings (short lines, possibly with numbers)
    const headings: string[] = [];
    for (const page of pages) {
      const lines = page.text.split("\n").filter(Boolean);
      for (const line of lines) {
        const trimmed = line.trim();
        if (
          trimmed.length > 3 &&
          trimmed.length < 80 &&
          (trimmed.match(/^(\d+[\.\)]\s|Chapter|Section|Part|CHAPTER|SECTION)/i) ||
            (trimmed === trimmed.toUpperCase() && trimmed.length > 5 && trimmed.length < 60))
        ) {
          headings.push(trimmed);
          if (headings.length >= 20) break;
        }
      }
      if (headings.length >= 20) break;
    }

    if (headings.length > 0) {
      return `**Found ${headings.length} potential headings/sections:**\n\n${headings.map((h) => `- ${h}`).join("\n")}`;
    }
    return "I couldn't find a clear table of contents or section headings in this document.";
  }

  if (q.match(/what('s| is) on page (\d+)/)) {
    const match = q.match(/page (\d+)/);
    if (match) {
      const pageNum = parseInt(match[1]);
      const page = pages.find((p) => p.pageNum === pageNum);
      if (page) {
        const preview = page.text.slice(0, 600).trim();
        return `**Page ${pageNum} content:**\n\n> ${preview}${page.text.length > 600 ? "..." : ""}`;
      }
      return `Page ${pageNum} does not exist. This document has ${totalPages} pages.`;
    }
  }

  // Search-based answers
  const keywords = q
    .replace(/[?.,!'"]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["what", "where", "when", "how", "does", "the", "this", "that", "find", "search", "look", "for", "about", "with", "from", "have", "has", "are", "was", "were", "been", "can", "could", "would", "should"].includes(w));

  if (keywords.length === 0) {
    return "I can help you explore this PDF! Try asking:\n\n- **\"Summarize this document\"**\n- **\"How many pages?\"**\n- **\"What's on page 3?\"**\n- **\"Find [keyword]\"**\n- Or search for any specific text or topic";
  }

  // Search for each keyword
  const allResults: { pageNum: number; snippet: string; matchCount: number }[] = [];

  for (const page of pages) {
    let matchCount = 0;
    const lower = page.text.toLowerCase();

    for (const kw of keywords) {
      const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const matches = lower.match(regex);
      if (matches) matchCount += matches.length;
    }

    if (matchCount > 0) {
      // Find the best snippet around the first match
      let bestIdx = -1;
      for (const kw of keywords) {
        const idx = lower.indexOf(kw);
        if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
          bestIdx = idx;
        }
      }

      if (bestIdx !== -1) {
        const start = Math.max(0, bestIdx - 100);
        const end = Math.min(page.text.length, bestIdx + 300);
        let snippet = page.text.slice(start, end).trim();
        if (start > 0) snippet = "..." + snippet;
        if (end < page.text.length) snippet = snippet + "...";
        allResults.push({ pageNum: page.pageNum, snippet, matchCount });
      }
    }
  }

  // Sort by relevance
  allResults.sort((a, b) => b.matchCount - a.matchCount);

  if (allResults.length === 0) {
    return `I couldn't find anything related to "${keywords.join(" ")}" in this document.\n\nTry different keywords or ask me to summarize the document.`;
  }

  const topResults = allResults.slice(0, 3);
  let response = `**Found ${allResults.length} relevant section${allResults.length !== 1 ? "s" : ""}** across the document:\n\n`;

  for (const result of topResults) {
    response += `**Page ${result.pageNum}** (${result.matchCount} match${result.matchCount !== 1 ? "es" : ""}):\n> ${result.snippet}\n\n`;
  }

  if (allResults.length > 3) {
    const otherPages = allResults
      .slice(3)
      .map((r) => r.pageNum)
      .join(", ");
    response += `_Also found on pages: ${otherPages}_`;
  }

  return response;
}

export default function ChatWithPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    setFiles(newFiles);
    setMessages([]);
    setPages([]);

    if (newFiles.length > 0) {
      setProcessing(true);
      setProgress(10);

      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.mjs",
          import.meta.url
        ).toString();

        const bytes = await newFiles[0].arrayBuffer();
        setProgress(30);
        const pdf = await pdfjs.getDocument({ data: bytes }).promise;
        const pageContents: PageContent[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const text = content.items.map((item: any) => item.str).join(" ");
          pageContents.push({ pageNum: i, text });
          setProgress(30 + Math.round((i / pdf.numPages) * 60));
        }

        setPages(pageContents);
        setProgress(100);

        const totalWords = pageContents
          .map((p) => p.text)
          .join(" ")
          .split(/\s+/)
          .filter(Boolean).length;

        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: `I've loaded your PDF! Here's what I found:\n\n- **Pages:** ${pdf.numPages}\n- **Words:** ~${totalWords.toLocaleString()}\n\nAsk me anything about this document. For example:\n- "Summarize this document"\n- "What's on page 2?"\n- "Find [any keyword or topic]"\n- "How many pages?"`,
            timestamp: new Date(),
          },
        ]);
      } catch (err) {
        console.error("Failed to parse PDF:", err);
        setMessages([
          {
            id: "error",
            role: "assistant",
            content: "Sorry, I couldn't read this PDF. It might be encrypted or corrupted. Try a different file.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setProcessing(false);
      }
    }
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || pages.length === 0) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    // Small delay for natural feel
    await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 600));

    const answer = generateAnswer(pages, trimmed);

    const assistantMsg: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: answer,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setThinking(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    if (pages.length > 0) {
      const totalWords = pages.map((p) => p.text).join(" ").split(/\s+/).filter(Boolean).length;
      setMessages([
        {
          id: "welcome-reset",
          role: "assistant",
          content: `Chat cleared! Your PDF is still loaded (${pages.length} pages, ~${totalWords.toLocaleString()} words).\n\nAsk me anything!`,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const suggestedQuestions = [
    "Summarize this document",
    "How many pages?",
    "What's on page 1?",
    "Find the main topic",
  ];

  return (
    <ToolLayout
      title="Chat with PDF"
      description="Ask questions about your PDF and get instant answers"
      icon={MessageSquareText}
      color="from-violet-500 to-indigo-600"
      processing={processing}
      progress={progress}
    >
      <div className="space-y-4">
        {/* File upload (collapsible when loaded) */}
        {pages.length === 0 ? (
          <FileUpload
            accept=".pdf"
            onFilesSelected={handleFilesSelected}
            files={files}
            onRemoveFile={() => {
              setFiles([]);
              setPages([]);
              setMessages([]);
            }}
            label="Upload a PDF to chat with"
            description="Drop a PDF file here to start asking questions"
          />
        ) : (
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium truncate max-w-[200px] sm:max-w-none">
                  {files[0]?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pages.length} pages loaded
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="gap-1 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Chat
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFiles([]);
                  setPages([]);
                  setMessages([]);
                }}
                className="text-xs"
              >
                New PDF
              </Button>
            </div>
          </div>
        )}

        {/* Chat area */}
        {pages.length > 0 && (
          <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden" style={{ height: "520px" }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary/70 border border-border rounded-bl-md"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-medium text-primary">pdfkit.pro</span>
                          </div>
                          <div className="prose prose-sm dark:prose-invert max-w-none [&_strong]:text-foreground [&_blockquote]:border-primary/30 [&_blockquote]:bg-secondary/50 [&_blockquote]:rounded [&_blockquote]:py-1 [&_blockquote]:px-3">
                            {msg.content.split("\n").map((line, i) => {
                              if (line.startsWith("> ")) {
                                return (
                                  <blockquote key={i} className="my-1 text-xs text-muted-foreground">
                                    {line.slice(2)}
                                  </blockquote>
                                );
                              }
                              if (line.startsWith("- ")) {
                                return (
                                  <div key={i} className="flex gap-1.5 ml-1">
                                    <span className="text-primary mt-0.5">•</span>
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/_(.+?)_/g, "<em>$1</em>"),
                                      }}
                                    />
                                  </div>
                                );
                              }
                              if (line.startsWith("**") && line.endsWith("**")) {
                                return <p key={i} className="font-semibold mt-2" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, "$1") }} />;
                              }
                              return (
                                <p
                                  key={i}
                                  className={line === "" ? "h-2" : ""}
                                  dangerouslySetInnerHTML={{
                                    __html: line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/_(.+?)_/g, "<em>$1</em>"),
                                  }}
                                />
                              );
                            })}
                          </div>
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {copiedId === msg.id ? (
                              <><Check className="h-3 w-3" /> Copied</>
                            ) : (
                              <><Copy className="h-3 w-3" /> Copy</>
                            )}
                          </button>
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Thinking indicator */}
              {thinking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-secondary/70 border border-border rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Analyzing your PDF...
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested questions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                        setTimeout(() => {
                          handleSend();
                        }, 50);
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your PDF..."
                  disabled={thinking}
                  className="flex-1 h-10 bg-secondary/30"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || thinking}
                  size="icon"
                  className="h-10 w-10 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                All processing happens locally in your browser. Your PDF is never uploaded.
              </p>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
