"use client";

import { motion } from "framer-motion";
import { Shield, Zap, WifiOff, Lock, Heart, FileText, Globe, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="relative py-12 md:py-20">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            About <span className="gradient-text">pdfkit.pro</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A free, privacy-first PDF toolkit that runs entirely in your browser.
            No servers, no uploads, no tracking.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="prose prose-neutral dark:prose-invert max-w-none mb-12"
        >
          <div className="glass rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              We believe PDF tools should be free, fast, and private. Most online PDF services
              upload your files to their servers, process them remotely, and may even store copies.
              pdfkit.pro takes a different approach everything runs locally in your browser using
              modern web technologies. Your files never leave your device.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          {[
            {
              icon: Shield,
              title: "Privacy First",
              description: "Your files are processed locally in your browser. Nothing is ever uploaded to a server.",
            },
            {
              icon: Zap,
              title: "Lightning Fast",
              description: "No server round-trips means instant processing. Everything happens on your device.",
            },
            {
              icon: WifiOff,
              title: "Works Offline",
              description: "Once the page loads, all tools work without an internet connection.",
            },
            {
              icon: Lock,
              title: "Secure",
              description: "No data collection, no cookies, no tracking. Your documents stay private.",
            },
            {
              icon: Globe,
              title: "Free Forever",
              description: "All tools are free to use with no limits, no watermarks, and no signup.",
            },
            {
              icon: Users,
              title: "For Everyone",
              description: "Simple, intuitive interface designed for anyone to use, not just tech experts.",
            },
          ].map((item) => (
            <div key={item.title} className="glass rounded-xl p-6">
              <item.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass rounded-2xl p-8 text-center mb-12"
        >
          <h2 className="text-2xl font-bold mb-4">Technology</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Built with modern web technologies for the best possible experience.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Next.js", "TypeScript", "Tailwind CSS", "pdf-lib", "PDF.js", "jsPDF", "Framer Motion"].map((tech) => (
              <span key={tech} className="px-4 py-2 rounded-full bg-secondary text-sm font-medium">
                {tech}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-4 flex items-center justify-center gap-2">
            Built by Sidheart <Heart className="h-4 w-4 text-red-500 fill-red-500" />
          </p>
          <Link href="/tools">
            <Button size="lg">Explore All Tools</Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
