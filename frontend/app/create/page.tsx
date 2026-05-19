import { Suspense } from "react";
import CreateWizard from "@/components/wizard/CreateWizard";

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>}>
      <CreateWizard />
    </Suspense>
  );
}
