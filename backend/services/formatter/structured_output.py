import re

from backend.models.schemas import PetitionMetadata, PetitionOutput

_INFORMAL_PATTERNS = (
    r"\b(ya|yani|işte|falan|filan|bi\s|baya)\b",
    r"!{2,}",
)
_LEGAL_HALLUCINATION_PATTERNS = (
    r"\b\d+\s*sayılı\s*kanun\b",
    r"\bYargıtay\s+\d+\.\s*Hukuk\s+Dairesi\b",
    r"\bTCK\s+\d+\b",
    r"\bTBK\s+\d+\b",
)


class StructuredOutputFormatter:
    def parse_and_validate(
        self,
        raw: dict,
        metadata: PetitionMetadata,
    ) -> PetitionOutput:
        body = str(raw.get("body", "")).strip()
        if not body:
            raise ValueError("LLM body boş döndü")

        tone = raw.get("tone", "formal")
        if tone not in ("formal", "urgent", "neutral"):
            tone = "formal"

        warnings: list[str] = list(raw.get("warnings") or [])
        warnings.extend(self._validate_body(body))
        warnings.extend(self._validate_metadata(metadata))

        if len(body) > 3000:
            body = body[:3000]
            warnings.append("Metin uzunluğu sınırlandırıldı")

        return PetitionOutput(body=body, tone=tone, warnings=warnings)

    def _validate_body(self, body: str) -> list[str]:
        warnings: list[str] = []
        for pattern in _INFORMAL_PATTERNS:
            if re.search(pattern, body, re.IGNORECASE):
                warnings.append("Metinde gayri resmi ifadeler tespit edildi")
                break
        for pattern in _LEGAL_HALLUCINATION_PATTERNS:
            if re.search(pattern, body, re.IGNORECASE):
                warnings.append("Metinde doğrulanamayan hukuki referans olabilir")
                break
        return warnings

    def _validate_metadata(self, metadata: PetitionMetadata) -> list[str]:
        warnings: list[str] = []
        if not metadata.user_name:
            warnings.append("Ad soyad eksik")
        if not metadata.date:
            warnings.append("Tarih eksik")
        if not metadata.subject:
            warnings.append("Konu başlığı eksik; varsayılan kullanılacak")
        return warnings
