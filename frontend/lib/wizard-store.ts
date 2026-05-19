import type { GenerateResponse, PetitionDetail, PetitionMetadata } from "@/lib/api";
import { EDITOR_STORAGE_KEY, WIZARD_STORAGE_KEY } from "@/lib/constants";

export interface WizardState {
  step: number;
  institution: string;
  petitionType: string;
  metadata: PetitionMetadata;
  userInput: string;
  smartAnswers: Record<string, string>;
}

export interface EditorState {
  petitionId: string;
  subject: string;
  content: string;
  institution: string;
  petitionType: string;
  warnings: string[];
}

const defaultWizard: WizardState = {
  step: 1,
  institution: "",
  petitionType: "",
  metadata: { date: new Date().toISOString().slice(0, 10) },
  userInput: "",
  smartAnswers: {},
};

export function loadWizardState(): WizardState {
  if (typeof window === "undefined") return defaultWizard;
  try {
    const raw = sessionStorage.getItem(WIZARD_STORAGE_KEY);
    return raw ? { ...defaultWizard, ...JSON.parse(raw) } : defaultWizard;
  } catch {
    return defaultWizard;
  }
}

export function saveWizardState(state: WizardState): void {
  sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(state));
}

export function saveEditorFromGenerate(
  response: GenerateResponse,
  institution: string,
  petitionType: string,
): void {
  const state: EditorState = {
    petitionId: response.petition_id,
    subject: response.subject,
    content: response.full_text,
    institution,
    petitionType,
    warnings: response.warnings,
  };
  sessionStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(state));
}

export function saveEditorFromPetition(petition: PetitionDetail): void {
  const state: EditorState = {
    petitionId: petition.id,
    subject: petition.subject ?? "Dilekçe",
    content: petition.content,
    institution: petition.institution,
    petitionType: petition.petition_type,
    warnings: [],
  };
  sessionStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(state));
}

export function loadEditorState(): EditorState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(EDITOR_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EditorState) : null;
  } catch {
    return null;
  }
}

export function saveEditorState(state: EditorState): void {
  sessionStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(state));
}
