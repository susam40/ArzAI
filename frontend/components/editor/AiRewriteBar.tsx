"use client";

import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RewriteAction } from "@/lib/api";

const ACTIONS: { action: RewriteAction; label: string }[] = [
  { action: "formal", label: "Daha resmi yaz" },
  { action: "shorten", label: "Kısalt" },
  { action: "expand", label: "Uzat" },
  { action: "legal", label: "Hukuki dil" },
  { action: "polite", label: "Daha nazik" },
];

interface AiRewriteBarProps {
  onRewrite: (action: RewriteAction) => void;
  loadingAction: RewriteAction | null;
}

export default function AiRewriteBar({ onRewrite, loadingAction }: AiRewriteBarProps) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
        <Wand2 className="h-4 w-4 text-primary" />
        AI Düzenleme
      </div>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map(({ action, label }) => (
          <Button
            key={action}
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingAction !== null}
            onClick={() => onRewrite(action)}
          >
            {loadingAction === action ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
