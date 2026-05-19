"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  deletePetition,
  fetchPetition,
  fetchPetitions,
  type PetitionSummary,
} from "@/lib/api";
import { INSTITUTIONS } from "@/lib/constants";
import { saveEditorFromPetition } from "@/lib/wizard-store";

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [petitions, setPetitions] = useState<PetitionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [action, setAction] = useState<"edit" | "delete" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPetitions(await fetchPetitions());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dilekçeler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const labelFor = (id: string) => INSTITUTIONS.find((i) => i.id === id)?.label ?? id;

  const handleEdit = async (id: string) => {
    setBusyId(id);
    setAction("edit");
    setError(null);
    try {
      const petition = await fetchPetition(id);
      saveEditorFromPetition(petition);
      router.push("/editor");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dilekçe açılamadı");
    } finally {
      setBusyId(null);
      setAction(null);
    }
  };

  const handleDelete = async (id: string, subject: string | null) => {
    const label = subject ?? "Bu dilekçe";
    if (!window.confirm(`${label} silinsin mi? Bu işlem geri alınamaz.`)) return;

    setBusyId(id);
    setAction("delete");
    setError(null);
    try {
      await deletePetition(id);
      setPetitions((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi");
    } finally {
      setBusyId(null);
      setAction(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Geçmiş Dilekçeler</h1>
          <p className="text-muted-foreground">Oluşturduğunuz dilekçeleri görüntüleyin ve düzenleyin</p>
        </div>
        <Button asChild>
          <Link href="/create">
            <PlusCircle className="h-4 w-4" />
            Yeni Dilekçe
          </Link>
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && petitions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="font-medium">Henüz dilekçe yok</p>
            <p className="mt-1 text-sm text-muted-foreground">İlk dilekçenizi oluşturmak için başlayın</p>
            <Button className="mt-6" asChild>
              <Link href="/create">Dilekçe Oluştur</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {petitions.map((p) => {
          const isBusy = busyId === p.id;
          return (
            <Card key={p.id} className="transition-shadow hover:shadow-elevated">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{p.subject ?? "Dilekçe"}</CardTitle>
                    <CardDescription>
                      {labelFor(p.institution)} · {p.petition_type}
                    </CardDescription>
                  </div>
                  <Badge variant={p.has_edits ? "success" : "default"}>{p.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
                <span>Oluşturulma: {formatDate(p.created_at)}</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => void handleEdit(p.id)}
                  >
                    {isBusy && action === "edit" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Pencil className="h-3 w-3" />
                    )}
                    Düzenle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    className="text-red-600 hover:text-red-700"
                    onClick={() => void handleDelete(p.id, p.subject)}
                  >
                    {isBusy && action === "delete" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Sil
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
