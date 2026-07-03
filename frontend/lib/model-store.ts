import { MODEL_STORAGE_KEY } from "@/lib/constants";

export function getSelectedModel(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(MODEL_STORAGE_KEY);
}

export function setSelectedModel(modelId: string): void {
  localStorage.setItem(MODEL_STORAGE_KEY, modelId);
}

export function clearSelectedModel(): void {
  localStorage.removeItem(MODEL_STORAGE_KEY);
}
