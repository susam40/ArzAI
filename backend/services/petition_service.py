import json
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.petition import Petition
from backend.models.schemas import (
    GenerateRequest,
    GenerateResponse,
    PetitionMetadata,
    PetitionSummary,
    SmartQuestionsResponse,
)
from backend.services.ai.llm_client import LLMError, NvidiaLLMClient
from backend.services.ai.prompt_builder import PromptBuilder
from backend.services.formatter.structured_output import StructuredOutputFormatter
from backend.services.template.engine import TemplateEngine
from backend.services.template.registry import TemplateRegistry


class PetitionService:
    def __init__(
        self,
        registry: TemplateRegistry | None = None,
        prompt_builder: PromptBuilder | None = None,
        llm_client: NvidiaLLMClient | None = None,
        formatter: StructuredOutputFormatter | None = None,
        template_engine: TemplateEngine | None = None,
    ) -> None:
        self._registry = registry or TemplateRegistry()
        self._prompt_builder = prompt_builder or PromptBuilder(self._registry)
        self._llm_client = llm_client or NvidiaLLMClient()
        self._formatter = formatter or StructuredOutputFormatter()
        self._template_engine = template_engine or TemplateEngine(self._registry)

    async def generate(self, db: AsyncSession, request: GenerateRequest) -> GenerateResponse:
        config = self._prompt_builder.get_config(request.institution, request.petition_type)
        system_prompt, user_prompt = self._prompt_builder.build(
            request.institution,
            request.petition_type,
            request.user_input,
            request.metadata,
        )

        try:
            raw_output = await self._llm_client.generate_json(system_prompt, user_prompt)
        except LLMError as exc:
            raise ValueError(f"AI üretimi başarısız: {exc}") from exc

        parsed = self._formatter.parse_and_validate(raw_output, request.metadata)
        metadata_dict = self._metadata_to_dict(request.metadata)
        subject = request.metadata.subject or config.subject_default

        full_text = self._template_engine.render_petition(
            config,
            subject=subject,
            ai_generated_body=parsed.body,
            metadata=metadata_dict,
        )

        petition = Petition(
            institution=request.institution,
            petition_type=request.petition_type,
            user_input=request.user_input,
            generated_body=parsed.body,
            full_text=full_text,
            subject=subject,
            metadata_json=json.dumps(metadata_dict, ensure_ascii=False),
        )
        db.add(petition)
        await db.flush()

        return GenerateResponse(
            petition_id=petition.id,
            generated_body=parsed.body,
            full_text=full_text,
            subject=subject,
            warnings=parsed.warnings,
        )

    async def list_petitions(self, db: AsyncSession, limit: int = 50) -> list[PetitionSummary]:
        result = await db.execute(
            select(Petition).order_by(Petition.created_at.desc()).limit(limit)
        )
        rows = result.scalars().all()
        return [
            PetitionSummary(
                id=row.id,
                institution=row.institution,
                petition_type=row.petition_type,
                subject=row.subject,
                status="düzenlendi" if row.edited_content else "oluşturuldu",
                created_at=row.created_at,
                has_edits=bool(row.edited_content),
            )
            for row in rows
        ]

    def smart_questions(
        self,
        institution: str,
        petition_type: str,
        metadata: PetitionMetadata,
        user_input: str,
    ) -> SmartQuestionsResponse:
        questions: list[str] = []
        if not metadata.date:
            questions.append("Olay veya başvuru tarihi nedir?")
        if not metadata.user_name:
            questions.append("Adınız ve soyadınız nedir?")
        if institution in {"court", "consumer_court", "labor_law", "employer"} and not metadata.institution_name:
            questions.append("İlgili kurum veya işyeri adı nedir?")
        if institution == "sgk" and "başvuru" not in user_input.lower():
            questions.append("SGK'ya daha önce başvuru yaptınız mı? Hangi tarihte?")
        if len(user_input) < 80:
            questions.append("Olayı birkaç cümleyle daha detaylı anlatabilir misiniz?")
        if not metadata.subject:
            questions.append("Dilekçe konusu ne olmalı?")
        return SmartQuestionsResponse(questions=questions[:4])

    async def get_petition(self, db: AsyncSession, petition_id: str) -> Petition | None:
        result = await db.execute(select(Petition).where(Petition.id == petition_id))
        return result.scalar_one_or_none()

    async def update_edited_content(
        self,
        db: AsyncSession,
        petition_id: str,
        edited_content: str,
    ) -> Petition | None:
        petition = await self.get_petition(db, petition_id)
        if petition is None:
            return None
        petition.edited_content = edited_content
        await db.flush()
        return petition

    def _metadata_to_dict(self, metadata: PetitionMetadata) -> dict:
        data = metadata.model_dump(exclude_none=True)
        if isinstance(data.get("date"), date):
            data["date"] = data["date"].isoformat()
        return data
