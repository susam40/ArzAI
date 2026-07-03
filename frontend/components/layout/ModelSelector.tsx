"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { fetchLlmModels, type LlmModelsResponse } from "@/lib/api";
import { getSelectedModel, setSelectedModel } from "@/lib/model-store";
import { cn } from "@/lib/utils";

export default function ModelSelector() {
  const [data, setData] = useState<LlmModelsResponse | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchLlmModels();
      setData(response);
      const stored = getSelectedModel();
      const initial =
        stored && response.models.some((m) => m.id === stored)
          ? stored
          : response.current_model;
      setSelected(initial);
      setSelectedModel(initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Modeller yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadModels();
  }, [loadModels]);

  const handleChange = (modelId: string) => {
    setSelected(modelId);
    setSelectedModel(modelId);
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Bot className="h-3.5 w-3.5" />
        LLM Modeli
      </label>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Modeller yükleniyor...
        </div>
      ) : error ? (
        <div className="space-y-2">
          <p className="text-xs text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => void loadModels()}
            className="text-xs font-medium text-primary hover:underline"
          >
            Tekrar dene
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <select
            value={selected}
            onChange={(e) => handleChange(e.target.value)}
            className={cn(
              "w-full rounded-lg border border-input bg-background px-2.5 py-2 text-xs",
              "focus:outline-none focus:ring-2 focus:ring-primary/30",
            )}
            title="NVIDIA chat modeli"
          >
            {data?.models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.id}
              </option>
            ))}
          </select>
          {data?.mock_mode && (
            <p className="text-[10px] leading-snug text-amber-700">
              Mock modu: API anahtarı yok, örnek model listesi kullanılıyor.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
