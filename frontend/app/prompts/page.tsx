"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetchPrompts, updatePrompt, type PromptInfo } from "@/lib/api";

const CATEGORY_LABELS: Record<string, string> = {
  generate: "Dilekçe üretimi",
  rewrite: "Editör",
};

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptInfo[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPrompts();
      setPrompts(data);
      if (data.length > 0) {
        setSelectedKey((current) =>
          current && data.some((p) => p.key === current) ? current : data[0].key,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Promptlar yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => prompts.find((p) => p.key === selectedKey) ?? null,
    [prompts, selectedKey],
  );

  useEffect(() => {
    if (selected) setDraft(selected.content);
  }, [selected]);

  const grouped = useMemo(() => {
    const map = new Map<string, PromptInfo[]>();
    for (const prompt of prompts) {
      const list = map.get(prompt.category) ?? [];
      list.push(prompt);
      map.set(prompt.category, list);
    }
    return map;
  }, [prompts]);

  const selectPrompt = (prompt: PromptInfo) => {
    setSelectedKey(prompt.key);
    setDraft(prompt.content);
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!selectedKey) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updatePrompt(selectedKey, draft);
      setPrompts((prev) => prev.map((p) => (p.key === updated.key ? updated : p)));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Prompt Yönetimi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dilekçe ve editör promptları buradan düzenlenir.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Yükleniyor…
        </div>
      ) : error && prompts.length === 0 ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-4 rounded-xl border bg-card p-3">
            {[...grouped.entries()].map(([category, items]) => (
              <div key={category}>
                <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {CATEGORY_LABELS[category] ?? category}
                </p>
                <ul className="space-y-1">
                  {items.map((prompt) => (
                    <li key={prompt.key}>
                      <button
                        type="button"
                        onClick={() => selectPrompt(prompt)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          selectedKey === prompt.key
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-accent"
                        }`}
                      >
                        {prompt.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </aside>

          <div className="rounded-xl border bg-card p-4">
            {selected ? (
              <>
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-foreground">{selected.label}</h2>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{selected.key}</p>
                  </div>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Kaydet
                  </Button>
                </div>
                <Textarea
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setSaved(false);
                  }}
                  rows={22}
                  className="font-mono text-sm"
                />
                {saved && (
                  <p className="mt-2 text-sm text-green-700">Kaydedildi. Yeni üretimlerde geçerli olur.</p>
                )}
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                <p className="mt-3 text-xs text-muted-foreground">
                  Şablon değişkenleri:{" "}
                  <code className="rounded bg-muted px-1">{"{institution_label}"}</code>,{" "}
                  <code className="rounded bg-muted px-1">{"{petition_type_label}"}</code>,{" "}
                  <code className="rounded bg-muted px-1">{"{meta_block}"}</code>,{" "}
                  <code className="rounded bg-muted px-1">{"{user_input}"}</code>,{" "}
                  <code className="rounded bg-muted px-1">{"{instruction}"}</code>,{" "}
                  <code className="rounded bg-muted px-1">{"{text}"}</code>
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Düzenlemek için soldan bir prompt seçin.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
