"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Zap,
  Wifi,
  WifiOff,
  Lock,
  Eye,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { tools } from "@/lib/tools-data";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export default function Home() {
  return (
    <div className="relative">
      {/* Background grid pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 animate-grid"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[128px]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                100% Free &middot; No Signup Required
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              All-in-One PDF Toolkit.{" "}
              <span className="gradient-text">Fast. Private. Browser-Based.</span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Merge, split, compress, convert, and edit PDFs directly in your browser.
              Your files never leave your device.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link href="/tools">
                <Button size="xl" className="gap-2 text-base">
                  Start Editing
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/tools">
                <Button variant="outline" size="xl" className="text-base">
                  Explore All Tools
                </Button>
              </Link>
            </motion.div>

            {/* Privacy banner */}
            <motion.div
              className="mt-10 inline-flex items-center gap-2 text-sm text-muted-foreground"
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Shield className="h-4 w-4 text-green-500" />
              Files never leave your browser. Everything processed locally.
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="relative py-20">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Every PDF Tool You Need
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              18 powerful tools to handle any PDF task. All running locally in your browser.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            {tools.map((tool) => (
              <motion.div key={tool.id} variants={fadeInUp} transition={{ duration: 0.3 }}>
                <Link href={tool.href}>
                  <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                    <div
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${tool.color} mb-3`}
                    >
                      <tool.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {tool.description}
                    </p>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/[0.02] group-hover:to-primary/[0.05] transition-all duration-300" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose pdfkit.pro?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built with privacy and performance at its core.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              {
                icon: Shield,
                title: "Privacy First",
                description:
                  "Your files never leave your device. Zero data collection. Zero tracking.",
                color: "text-green-500",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description:
                  "Powered by WebAssembly and modern browser APIs. Instant processing.",
                color: "text-yellow-500",
              },
              {
                icon: WifiOff,
                title: "Works Offline",
                description:
                  "Once loaded, tools work without internet. Process PDFs anywhere.",
                color: "text-blue-500",
              },
              {
                icon: Lock,
                title: "Secure by Design",
                description:
                  "No server uploads. No cloud storage. Your files stay with you.",
                color: "text-purple-500",
              },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                transition={{ duration: 0.3 }}
                className="glass rounded-xl p-6 text-center hover:glow-sm transition-all duration-300"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-card mb-4 ${feature.color}`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-20">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            className="glass rounded-2xl p-8 md:p-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "18+", label: "PDF Tools" },
                { value: "0", label: "Data Collected" },
                { value: "100%", label: "Browser Based" },
                { value: "Free", label: "Forever" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              No signup. No credit card. Just powerful PDF tools at your fingertips.
            </p>
            <Link href="/tools">
              <Button size="xl" className="gap-2 text-base">
                Try All Tools Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
