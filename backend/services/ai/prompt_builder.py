from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.schemas import PetitionMetadata
from backend.services.prompt_service import PromptService
from backend.services.template.registry import TemplateConfig, TemplateRegistry


class PromptBuilder:
    def __init__(
        self,
        registry: TemplateRegistry | None = None,
        prompt_service: PromptService | None = None,
    ) -> None:
        self._registry = registry or TemplateRegistry()
        self._prompts = prompt_service or PromptService()

    def get_config(self, institution: str, petition_type: str) -> TemplateConfig:
        return self._registry.get_config(institution, petition_type)

    async def build(
        self,
        db: AsyncSession,
        institution: str,
        petition_type: str,
        user_input: str,
        metadata: PetitionMetadata,
    ) -> tuple[str, str]:
        config = self.get_config(institution, petition_type)
        base = await self._prompts.get_content(db, "generate.base_system")
        system_prompt = base + config.extra_prompt

        user_template = await self._prompts.get_content(db, "generate.user_template")
        user_prompt = user_template.format(
            institution_label=config.institution_label,
            petition_type_label=config.petition_type_label,
            meta_block=self._build_meta_block(metadata, config),
            user_input=user_input,
        )
        return system_prompt, user_prompt

    def _build_meta_block(self, metadata: PetitionMetadata, config: TemplateConfig) -> str:
        meta_lines: list[str] = []
        if metadata.user_name:
            meta_lines.append(f"Ad Soyad: {metadata.user_name}")
        if metadata.id_number:
            meta_lines.append(f"Kimlik No: {metadata.id_number}")
        if metadata.institution_name:
            meta_lines.append(f"Kurum/İşyeri: {metadata.institution_name}")
        if metadata.date:
            meta_lines.append(f"Olay/Talep Tarihi: {metadata.date.isoformat()}")
        if metadata.subject:
            meta_lines.append(f"Konu: {metadata.subject}")
        else:
            meta_lines.append(f"Konu: {config.subject_default}")
        return "\n".join(meta_lines) if meta_lines else "Ek bilgi yok."
