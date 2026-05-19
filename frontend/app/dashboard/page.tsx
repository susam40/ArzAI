"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText, PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchPetitions, type PetitionSummary } from "@/lib/api";
import { INSTITUTIONS } from "@/lib/constants";

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
  const [petitions, setPetitions] = useState<PetitionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPetitions()
      .then(setPetitions)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const labelFor = (id: string) => INSTITUTIONS.find((i) => i.id === id)?.label ?? id;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Geçmiş Dilekçeler</h1>
          <p className="text-muted-foreground">Oluşturduğunuz dilekçeleri görüntüleyin</p>
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
        {petitions.map((p) => (
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
              <Button variant="outline" size="sm" asChild>
                <Link href="/create">Yeni benzer</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
