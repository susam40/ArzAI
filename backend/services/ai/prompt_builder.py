from backend.models.schemas import PetitionMetadata
from backend.services.template.registry import TemplateConfig, TemplateRegistry


class PromptBuilder:
    def __init__(self, registry: TemplateRegistry | None = None) -> None:
        self._registry = registry or TemplateRegistry()

    def get_config(self, institution: str, petition_type: str) -> TemplateConfig:
        return self._registry.get_config(institution, petition_type)

    def build(
        self,
        institution: str,
        petition_type: str,
        user_input: str,
        metadata: PetitionMetadata,
    ) -> tuple[str, str]:
        config = self.get_config(institution, petition_type)
        system_prompt = config.system_prompt
        user_prompt = self._format_user_prompt(user_input, metadata, config)
        return system_prompt, user_prompt

    def _format_user_prompt(
        self,
        user_input: str,
        metadata: PetitionMetadata,
        config: TemplateConfig,
    ) -> str:
        meta_lines = []
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

        meta_block = "\n".join(meta_lines) if meta_lines else "Ek bilgi yok."
        return (
            f"Kurum: {config.institution_label}\n"
            f"Dilekçe türü: {config.petition_type_label}\n\n"
            f"Kullanıcı bilgileri:\n{meta_block}\n\n"
            f"Kullanıcının anlattığı olay:\n{user_input}\n\n"
            "Yalnızca JSON formatında body, tone ve warnings alanlarını döndür."
        )
