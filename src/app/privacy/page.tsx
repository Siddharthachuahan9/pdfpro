"use client";

import { motion } from "framer-motion";
import { Shield, Server, Eye, Cookie, Database, FileText } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="relative py-12 md:py-20">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg">
            Your privacy matters. Here is exactly how we handle your data.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-8"
        >
          {[
            {
              icon: FileText,
              title: "Your Files",
              content: "All PDF processing happens entirely in your browser. Your files are never uploaded to any server. They stay on your device at all times. When you close the tab, all file data is removed from memory.",
            },
            {
              icon: Server,
              title: "No Server Processing",
              content: "We do not have any servers that process your files. All tools use client-side JavaScript libraries (pdf-lib, PDF.js, jsPDF) that run entirely in your browser. There is no backend.",
            },
            {
              icon: Eye,
              title: "No Tracking",
              content: "We do not use any analytics, tracking pixels, or third-party scripts. We do not track your usage, your files, or your behavior. We do not use Google Analytics or any similar service.",
            },
            {
              icon: Cookie,
              title: "No Cookies",
              content: "We do not set any cookies. The only data stored locally is your theme preference (light/dark mode) using localStorage, which never leaves your device.",
            },
            {
              icon: Database,
              title: "No Data Collection",
              content: "We do not collect, store, or process any personal data. We do not require registration, email addresses, or any personal information. The site works completely anonymously.",
            },
            {
              icon: Shield,
              title: "Security",
              content: "Since all processing is local, your documents are as secure as your device. We recommend keeping your browser up to date for the latest security patches.",
            },
          ].map((section) => (
            <div key={section.title} className="glass rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-2">{section.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="text-center pt-8">
            <p className="text-sm text-muted-foreground">
              Last updated: February 2026
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
