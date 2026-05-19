"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileCheck, Shield, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Sparkles, title: "AI Destekli", desc: "Resmi dilde otomatik metin üretimi" },
  { icon: Shield, title: "Güvenilir", desc: "Şablon tabanlı, kontrollü çıktı" },
  { icon: FileCheck, title: "Hazır Format", desc: "PDF ve DOCX olarak indirin" },
  { icon: Zap, title: "Hızlı", desc: "Dakikalar içinde dilekçe hazır" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FileCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold text-foreground">ArzAI</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/create" className="hover:text-foreground">
            Dilekçe Oluştur
          </Link>
          <Link href="/dashboard" className="hover:text-foreground">
            Geçmiş
          </Link>
        </nav>
        <Button asChild>
          <Link href="/create">Başla</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-20 pt-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-xs font-medium text-primary shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Legal-tech • Gov-tech
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            AI Destekli Resmi
            <br />
            <span className="text-primary">Dilekçe Oluşturucu</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Dakikalar içinde profesyonel ve resmi dilekçeler oluşturun. Adım adım rehberlik,
            AI ile metin üretimi, canlı önizleme ve PDF/DOCX dışa aktarma.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="min-w-[200px]">
              <Link href="/create">
                Dilekçe Oluştur
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="min-w-[200px]">
              <Link href="/create?demo=1">Örnek Gör</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mx-auto mt-20 grid max-w-3xl gap-4 sm:grid-cols-2"
        >
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border bg-white p-6 text-left shadow-card transition-shadow hover:shadow-elevated"
            >
              <f.icon className="mb-3 h-6 w-6 text-primary" />
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </section>

      <footer className="border-t bg-white/80 py-8 text-center text-sm text-muted-foreground">
        ArzAI — Resmi dilekçe oluşturma platformu
      </footer>
    </div>
  );
}
