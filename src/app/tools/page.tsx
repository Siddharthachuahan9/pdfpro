"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { tools, categories } from "@/lib/tools-data";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.03,
    },
  },
};

export default function ToolsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || tool.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="relative py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            All PDF Tools
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Select a tool to get started. Everything runs locally in your browser.
          </p>
        </motion.div>

        {/* Search and filters */}
        <motion.div
          className="max-w-xl mx-auto mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </motion.div>

        {/* Category tabs */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-2 mb-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              !activeCategory
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                cat === activeCategory
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Tools grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          {filtered.map((tool) => (
            <motion.div
              key={tool.id}
              variants={fadeInUp}
              transition={{ duration: 0.3 }}
              layout
            >
              <Link href={tool.href}>
                <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full">
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${tool.color} mb-4`}
                  >
                    <tool.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1.5 group-hover:text-primary transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tool.description}
                  </p>
                  <span className="mt-3 inline-block text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {tool.category}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/[0.02] group-hover:to-primary/[0.05] transition-all duration-300" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No tools found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
