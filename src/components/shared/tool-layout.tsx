"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ToolLayoutProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  children: React.ReactNode;
  processing?: boolean;
  progress?: number;
}

export function ToolLayout({
  title,
  description,
  icon: Icon,
  color,
  children,
  processing = false,
  progress = 0,
}: ToolLayoutProps) {
  return (
    <div className="relative py-8 md:py-12 min-h-[calc(100vh-8rem)]">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Link href="/tools">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              All Tools
            </Button>
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4 mb-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br",
                color
              )}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
          </div>

          {/* Privacy badge */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
            <Shield className="h-3.5 w-3.5 text-green-500" />
            Files never leave your browser. Everything processed locally.
          </div>
        </motion.div>

        {/* Processing bar */}
        {processing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Processing...</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
