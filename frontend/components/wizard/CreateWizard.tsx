"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { INSTITUTIONS } from "@/lib/constants";
import {
  fetchSmartQuestions,
  fetchTemplates,
  generatePetition,
  type PetitionMetadata,
  type TemplateInfo,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  loadWizardState,
  saveEditorFromGenerate,
  saveWizardState,
  type WizardState,
} from "@/lib/wizard-store";
import WizardProgress from "./WizardProgress";

export default function CreateWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [state, setState] = useState<WizardState>(loadWizardState);
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates().then(setTemplates).catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (searchParams.get("demo") === "1" && !state.institution) {
      setState((s) => ({
        ...s,
        institution: "cimer",
        petitionType: "complaint",
        step: 1,
      }));
    }
  }, [searchParams, state.institution]);

  useEffect(() => {
    saveWizardState(state);
  }, [state]);

  const petitionTypes = useMemo(
    () => templates.filter((t) => t.institution === state.institution),
    [templates, state.institution],
  );

  const selectedTemplate = petitionTypes.find((t) => t.petition_type === state.petitionType);

  useEffect(() => {
    if (petitionTypes.length && !petitionTypes.some((t) => t.petition_type === state.petitionType)) {
      setState((s) => ({ ...s, petitionType: petitionTypes[0].petition_type }));
    }
  }, [petitionTypes, state.petitionType]);

  useEffect(() => {
    if (selectedTemplate && !state.metadata.subject) {
      setState((s) => ({
        ...s,
        metadata: { ...s.metadata, subject: selectedTemplate.subject_default },
      }));
    }
  }, [selectedTemplate, state.metadata.subject]);

  const loadQuestions = useCallback(async () => {
    if (!state.institution || !state.petitionType) return;
    try {
      const qs = await fetchSmartQuestions({
        institution: state.institution,
        petition_type: state.petitionType,
        metadata: state.metadata,
        user_input: state.userInput,
      });
      setQuestions(qs);
    } catch {
      setQuestions([]);
    }
  }, [state]);

  useEffect(() => {
    if (state.step === 3) loadQuestions();
  }, [state.step, loadQuestions]);

  const updateMeta = (key: keyof PetitionMetadata, value: string) => {
    setState((s) => ({ ...s, metadata: { ...s.metadata, [key]: value } }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const extra = Object.values(state.smartAnswers).filter(Boolean).join("\n");
      const userInput = [state.userInput, extra].filter(Boolean).join("\n\n");
      const response = await generatePetition({
        institution: state.institution,
        petition_type: state.petitionType,
        user_input: userInput,
        metadata: state.metadata,
      });
      saveEditorFromGenerate(response, state.institution, state.petitionType);
      router.push("/editor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Üretim başarısız");
    } finally {
      setLoading(false);
    }
  };

  const canNext =
    (state.step === 1 && !!state.institution) ||
    (state.step === 2 && !!state.petitionType) ||
    state.step === 3;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Yeni Dilekçe</h1>
        <p className="text-muted-foreground">Adım adım resmi dilekçenizi oluşturun</p>
      </div>
      <WizardProgress step={state.step} />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {state.step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Kurum Seçimi</CardTitle>
                <CardDescription>Dilekçenizi ileteceğiniz kurumu seçin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {INSTITUTIONS.map((inst) => {
                    const Icon = inst.icon;
                    const selected = state.institution === inst.id;
                    const available = templates.some((t) => t.institution === inst.id);
                    return (
                      <button
                        key={inst.id}
                        type="button"
                        disabled={!available && templates.length > 0}
                        onClick={() =>
                          setState((s) => ({ ...s, institution: inst.id, petitionType: "" }))
                        }
                        className={cn(
                          "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all",
                          selected
                            ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                            : "border-border bg-card hover:border-primary/40 hover:shadow-card",
                          !available && templates.length > 0 && "opacity-40",
                        )}
                      >
                        <Icon className={cn("h-6 w-6", selected ? "text-primary" : "text-muted-foreground")} />
                        <div>
                          <p className="font-semibold">{inst.label}</p>
                          <p className="text-xs text-muted-foreground">{inst.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {state.step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Dilekçe Türü</CardTitle>
                <CardDescription>Başvuru türünü belirleyin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {petitionTypes.map((t) => {
                    const selected = state.petitionType === t.petition_type;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setState((s) => ({ ...s, petitionType: t.petition_type }))}
                        className={cn(
                          "rounded-xl border p-4 text-left transition-all",
                          selected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "hover:border-primary/30 hover:bg-accent/50",
                        )}
                      >
                        <p className="font-semibold">{t.petition_type_label}</p>
                        <p className="text-xs text-muted-foreground">{t.subject_default}</p>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {state.step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Bilgi Girişi
                </CardTitle>
                <CardDescription>Resmi dilekçe için gerekli bilgileri girin</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium">Ad Soyad *</span>
                  <Input
                    value={state.metadata.user_name ?? ""}
                    onChange={(e) => updateMeta("user_name", e.target.value)}
                    placeholder="Adınız Soyadınız"
                  />
                </label>
                <label className="space-y-1.5 text-sm sm:col-span-2">
                  <span className="font-medium">Adres</span>
                  <Input
                    value={state.metadata.address ?? ""}
                    onChange={(e) => updateMeta("address", e.target.value)}
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium">Telefon</span>
                  <Input
                    value={state.metadata.phone ?? ""}
                    onChange={(e) => updateMeta("phone", e.target.value)}
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium">Tarih *</span>
                  <Input
                    type="date"
                    value={state.metadata.date ?? ""}
                    onChange={(e) => updateMeta("date", e.target.value)}
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium">Konu *</span>
                  <Input
                    value={state.metadata.subject ?? ""}
                    onChange={(e) => updateMeta("subject", e.target.value)}
                  />
                </label>
                {(state.institution === "university" ||
                  state.institution === "employer" ||
                  state.institution === "labor_law") && (
                  <label className="space-y-1.5 text-sm sm:col-span-2">
                    <span className="font-medium">Kurum / İşyeri Adı</span>
                    <Input
                      value={state.metadata.institution_name ?? ""}
                      onChange={(e) => updateMeta("institution_name", e.target.value)}
                    />
                  </label>
                )}
                <label className="space-y-1.5 text-sm sm:col-span-2">
                  <span className="font-medium">Olay Açıklaması *</span>
                  <Textarea
                    rows={6}
                    value={state.userInput}
                    onChange={(e) => setState((s) => ({ ...s, userInput: e.target.value }))}
                    placeholder="Sorununuzu kendi cümlelerinizle anlatın..."
                    minLength={10}
                  />
                </label>
              </CardContent>
            </Card>

            {questions.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">AI Akıllı Sorular</CardTitle>
                  <CardDescription>Eksik bilgileri tamamlayın</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {questions.map((q) => (
                    <label key={q} className="block space-y-1.5 text-sm">
                      <span className="font-medium text-primary">{q}</span>
                      <Input
                        value={state.smartAnswers[q] ?? ""}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            smartAnswers: { ...s.smartAnswers, [q]: e.target.value },
                          }))
                        }
                      />
                    </label>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 flex justify-between">
        <Button
          variant="outline"
          disabled={state.step === 1 || loading}
          onClick={() => setState((s) => ({ ...s, step: Math.max(1, s.step - 1) }))}
        >
          <ArrowLeft className="h-4 w-4" />
          Geri
        </Button>
        {state.step < 3 ? (
          <Button
            disabled={!canNext}
            onClick={() => setState((s) => ({ ...s, step: s.step + 1 }))}
          >
            İleri
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            disabled={loading || state.userInput.length < 10}
            onClick={handleGenerate}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Dilekçe Oluştur
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
