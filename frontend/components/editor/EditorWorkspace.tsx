"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Loader2, Printer, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TipTapEditor from "@/components/TipTapEditor";
import AiRewriteBar from "./AiRewriteBar";
import PdfPreview from "./PdfPreview";
import {
  downloadBlob,
  exportDocx,
  exportPdf,
  rewriteText,
  updatePetition,
  type RewriteAction,
} from "@/lib/api";
import { markdownInlineToHtml } from "@/lib/markdown";
import { loadEditorState, saveEditorState, type EditorState } from "@/lib/wizard-store";
import ModelSelector from "@/components/layout/ModelSelector";
import { INSTITUTIONS } from "@/lib/constants";

export default function EditorWorkspace() {
  const router = useRouter();
  const [state, setState] = useState<EditorState | null>(null);
  const [content, setContent] = useState("");
  const [rewritingAction, setRewritingAction] = useState<RewriteAction | null>(null);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    const saved = loadEditorState();
    if (!saved) {
      router.replace("/create");
      return;
    }
    setState(saved);
    setContent(saved.content);
  }, [router]);

  useEffect(() => {
    if (state) {
      saveEditorState({ ...state, content });
      setSaved(false);
    }
  }, [content, state]);

  const institutionLabel =
    INSTITUTIONS.find((i) => i.id === state?.institution)?.label ?? state?.institution;

  const handleRewrite = async (action: RewriteAction) => {
    if (!content || rewritingAction) return;
    setRewritingAction(action);
    setError(null);
    try {
      const rewritten = await rewriteText(content, action);
      setContent(rewritten);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Düzenleme başarısız");
    } finally {
      setRewritingAction(null);
    }
  };

  const handleSave = async () => {
    if (!state || saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updatePetition(state.petitionId, {
        subject: state.subject,
        content,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format: "pdf" | "docx") => {
    if (!state || exporting) return;
    setExporting(true);
    setError(null);
    try {
      const title = state.subject || "Dilekce";
      const blob =
        format === "pdf"
          ? await exportPdf(state.petitionId, content, title)
          : await exportDocx(state.petitionId, content, title);
      downloadBlob(blob, `${title}.${format}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dışa aktarma başarısız");
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = useCallback(() => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<html><head><title>${state?.subject ?? "Dilekçe"}</title></head><body style="font-family:Times New Roman,serif;padding:2cm;line-height:1.65">${markdownInlineToHtml(content)}</body></html>`,
    );
    w.document.close();
    w.print();
  }, [content, state?.subject]);

  if (!state) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b bg-card px-6 py-4">
        <div>
          <h1 className="text-xl font-bold">Dilekçe Editörü</h1>
          <p className="text-sm text-muted-foreground">
            {institutionLabel} · {state.subject}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] max-w-xs lg:hidden">
            <ModelSelector />
          </div>
          <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={saving || exporting} onClick={() => void handleSave()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Kaydet
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPreview((v) => !v)}>
            <FileText className="h-4 w-4" />
            {showPreview ? "Önizlemeyi Gizle" : "Önizleme"}
          </Button>
          <Button variant="outline" size="sm" disabled={exporting} onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Yazdır
          </Button>
          <Button variant="outline" size="sm" disabled={exporting} onClick={() => handleExport("docx")}>
            <Download className="h-4 w-4" />
            DOCX
          </Button>
          <Button size="sm" disabled={exporting} onClick={() => handleExport("pdf")}>
            <Download className="h-4 w-4" />
            PDF İndir
          </Button>
          </div>
        </div>
      </header>

      {saved && (
        <div className="mx-6 mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          Dilekçe kaydedildi.
        </div>
      )}

      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {state.warnings.length > 0 && (
        <div className="mx-6 mt-4 flex flex-wrap gap-2">
          {state.warnings.map((w) => (
            <Badge key={w} variant="secondary">
              {w}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-2">
        <div className="overflow-y-auto border-r p-6 space-y-4">
          <AiRewriteBar onRewrite={handleRewrite} loadingAction={rewritingAction} />
          <TipTapEditor content={content} onChange={setContent} />
        </div>
        <div className="hidden overflow-y-auto bg-muted/20 p-6 lg:block">
          {showPreview && <PdfPreview content={content} title={state.subject} />}
        </div>
      </div>

      <div className="border-t bg-card p-4 lg:hidden">
        {showPreview && <PdfPreview content={content} title={state.subject} />}
      </div>
    </div>
  );
}
