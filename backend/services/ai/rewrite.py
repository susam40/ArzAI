from backend.models.schemas import RewriteAction
from backend.services.ai.llm_client import LLMError, NvidiaLLMClient

_REWRITE_PROMPTS: dict[RewriteAction, str] = {
    "formal": "Metni daha resmi ve kurumsal Türkçe ile yeniden yaz. Yalnızca düz metin döndür.",
    "shorten": "Metni anlamı koruyarak kısalt. Yalnızca düz metin döndür.",
    "expand": "Metni daha ayrıntılı ama abartısız şekilde genişlet. Yalnızca düz metin döndür.",
    "legal": "Metni daha hukuki ve resmi üslupla yeniden yaz; kanun numarası UYDURMA. Yalnızca düz metin döndür.",
    "polite": "Metni daha nazik ve saygılı bir üslupla yeniden yaz. Yalnızca düz metin döndür.",
}


class RewriteService:
    def __init__(self, llm_client: NvidiaLLMClient | None = None) -> None:
        self._llm = llm_client or NvidiaLLMClient()

    async def rewrite(self, text: str, action: RewriteAction) -> str:
        instruction = _REWRITE_PROMPTS[action]
        system_prompt = (
            "Sen resmi Türkçe yazışma editörüsün. "
            "Görevin verilen metni talimata göre düzenlemek. "
            "JSON kullanma, sadece düzenlenmiş metni döndür."
        )
        user_prompt = f"{instruction}\n\nMetin:\n{text}"
        try:
            result = await self._llm.generate_text(system_prompt, user_prompt, temperature=0.2)
        except LLMError as exc:
            raise ValueError(f"Yeniden yazma başarısız: {exc}") from exc
        return result.strip()
