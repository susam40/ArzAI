import { cn } from "@/lib/utils";

const STEPS = ["Kurum", "Tür", "Bilgiler"];

export default function WizardProgress({ step }: { step: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {STEPS.map((label, index) => {
        const num = index + 1;
        const active = step === num;
        const done = step > num;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                done && "bg-primary text-primary-foreground",
                active && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                !done && !active && "bg-muted text-muted-foreground",
              )}
            >
              {done ? "✓" : num}
            </span>
            <span
              className={cn(
                "hidden text-sm font-medium sm:inline",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {index < STEPS.length - 1 && (
              <span className={cn("mx-2 block h-px w-8 sm:w-16", done ? "bg-primary" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
