from datetime import date as DateType, datetime
from typing import Literal

from pydantic import BaseModel, Field


class PetitionMetadata(BaseModel):
    date: DateType | None = None
    user_name: str | None = None
    id_number: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    institution_name: str | None = None
    subject: str | None = None
    recipient_title: str | None = None


class GenerateRequest(BaseModel):
    institution: str = Field(..., min_length=1, max_length=64)
    petition_type: str = Field(..., min_length=1, max_length=64)
    user_input: str = Field(..., min_length=10, max_length=5000)
    metadata: PetitionMetadata = Field(default_factory=PetitionMetadata)


class PetitionOutput(BaseModel):
    body: str = Field(..., max_length=3000)
    tone: Literal["formal", "urgent", "neutral"] = "formal"
    warnings: list[str] = Field(default_factory=list)


class GenerateResponse(BaseModel):
    petition_id: str
    generated_body: str
    full_text: str
    subject: str
    warnings: list[str] = Field(default_factory=list)


class ExportPdfRequest(BaseModel):
    petition_id: str | None = None
    content: str | None = Field(None, min_length=10)
    title: str = "Dilekçe"


class ExportDocxRequest(BaseModel):
    petition_id: str | None = None
    content: str | None = Field(None, min_length=10)
    title: str = "Dilekçe"


class TemplateFieldInfo(BaseModel):
    name: str
    label: str
    required: bool = False


class TemplateInfo(BaseModel):
    id: str
    institution: str
    institution_label: str
    petition_type: str
    petition_type_label: str
    subject_default: str
    required_fields: list[TemplateFieldInfo]


class TemplatesResponse(BaseModel):
    templates: list[TemplateInfo]


class PetitionSummary(BaseModel):
    id: str
    institution: str
    petition_type: str
    subject: str | None
    status: str
    created_at: datetime
    has_edits: bool


class PetitionsListResponse(BaseModel):
    petitions: list[PetitionSummary]


class PetitionDetail(BaseModel):
    id: str
    institution: str
    petition_type: str
    subject: str | None
    content: str
    user_input: str
    generated_body: str
    full_text: str
    metadata: PetitionMetadata = Field(default_factory=PetitionMetadata)
    created_at: datetime
    has_edits: bool


class PetitionUpdateRequest(BaseModel):
    subject: str | None = Field(None, min_length=1, max_length=256)
    content: str | None = Field(None, min_length=10, max_length=50000)


RewriteAction = Literal["formal", "shorten", "expand", "legal", "polite"]


class RewriteRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=8000)
    action: RewriteAction


class RewriteResponse(BaseModel):
    text: str


class SmartQuestionsRequest(BaseModel):
    institution: str
    petition_type: str
    metadata: PetitionMetadata = Field(default_factory=PetitionMetadata)
    user_input: str = ""


class SmartQuestionsResponse(BaseModel):
    questions: list[str]


class PromptInfo(BaseModel):
    key: str
    label: str
    category: str
    content: str
    updated_at: datetime


class PromptsListResponse(BaseModel):
    prompts: list[PromptInfo]


class PromptUpdateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=20000)
