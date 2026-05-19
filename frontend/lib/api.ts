const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export interface TemplateFieldInfo {
  name: string;
  label: string;
  required: boolean;
}

export interface TemplateInfo {
  id: string;
  institution: string;
  institution_label: string;
  petition_type: string;
  petition_type_label: string;
  subject_default: string;
  required_fields: TemplateFieldInfo[];
}

export interface PetitionMetadata {
  date?: string;
  user_name?: string;
  id_number?: string;
  address?: string;
  phone?: string;
  email?: string;
  institution_name?: string;
  subject?: string;
  recipient_title?: string;
}

export interface GenerateRequest {
  institution: string;
  petition_type: string;
  user_input: string;
  metadata: PetitionMetadata;
}

export interface GenerateResponse {
  petition_id: string;
  generated_body: string;
  full_text: string;
  subject: string;
  warnings: string[];
}

export interface PetitionSummary {
  id: string;
  institution: string;
  petition_type: string;
  subject: string | null;
  status: string;
  created_at: string;
  has_edits: boolean;
}

export interface PetitionDetail {
  id: string;
  institution: string;
  petition_type: string;
  subject: string | null;
  content: string;
  user_input: string;
  generated_body: string;
  full_text: string;
  metadata: PetitionMetadata;
  created_at: string;
  has_edits: boolean;
}

export interface PetitionUpdatePayload {
  subject?: string;
  content?: string;
}

export type RewriteAction = "formal" | "shorten" | "expand" | "legal" | "polite";

export interface PromptInfo {
  key: string;
  label: string;
  category: string;
  content: string;
  updated_at: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!response.ok) {
    let detail = await response.text();
    try {
      const parsed = JSON.parse(detail) as { detail?: string };
      detail = parsed.detail ?? detail;
    } catch {
      /* keep raw */
    }
    throw new Error(detail || `API error: ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function fetchTemplates(): Promise<TemplateInfo[]> {
  const data = await apiFetch<{ templates: TemplateInfo[] }>("/api/templates");
  return data.templates;
}

export async function fetchPetitions(): Promise<PetitionSummary[]> {
  const data = await apiFetch<{ petitions: PetitionSummary[] }>("/api/petitions");
  return data.petitions;
}

export async function fetchPetition(petitionId: string): Promise<PetitionDetail> {
  return apiFetch<PetitionDetail>(`/api/petitions/${encodeURIComponent(petitionId)}`);
}

export async function updatePetition(
  petitionId: string,
  payload: PetitionUpdatePayload,
): Promise<PetitionDetail> {
  return apiFetch<PetitionDetail>(`/api/petitions/${encodeURIComponent(petitionId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deletePetition(petitionId: string): Promise<void> {
  await apiFetch<void>(`/api/petitions/${encodeURIComponent(petitionId)}`, {
    method: "DELETE",
  });
}

export async function fetchSmartQuestions(payload: {
  institution: string;
  petition_type: string;
  metadata: PetitionMetadata;
  user_input: string;
}): Promise<string[]> {
  const data = await apiFetch<{ questions: string[] }>("/api/petitions/smart-questions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.questions;
}

export async function generatePetition(payload: GenerateRequest): Promise<GenerateResponse> {
  return apiFetch<GenerateResponse>("/api/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchPrompts(): Promise<PromptInfo[]> {
  const data = await apiFetch<{ prompts: PromptInfo[] }>("/api/prompts");
  return data.prompts;
}

export async function updatePrompt(key: string, content: string): Promise<PromptInfo> {
  return apiFetch<PromptInfo>(`/api/prompts/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

export async function rewriteText(text: string, action: RewriteAction): Promise<string> {
  const data = await apiFetch<{ text: string }>("/api/rewrite", {
    method: "POST",
    body: JSON.stringify({ text, action }),
  });
  return data.text;
}

export async function exportPdf(petitionId: string, content: string, title: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}/api/export/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ petition_id: petitionId, content, title }),
  });
  if (!response.ok) throw new Error("PDF export failed");
  return response.blob();
}

export async function exportDocx(petitionId: string, content: string, title: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}/api/export/docx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ petition_id: petitionId, content, title }),
  });
  if (!response.ok) throw new Error("DOCX export failed");
  return response.blob();
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function getPdfPreviewUrl(content: string, title: string): string {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  return URL.createObjectURL(blob);
}
