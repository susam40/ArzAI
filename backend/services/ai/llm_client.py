import json
import logging
import re
from typing import Any

import httpx

from backend.config import Settings, get_settings

logger = logging.getLogger(__name__)


class LLMError(Exception):
    pass


class NvidiaLLMClient:
    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        *,
        temperature: float = 0.3,
        max_tokens: int = 1200,
    ) -> dict[str, Any]:
        if self._settings.llm_mock or not self._settings.nvidia_api_key:
            return self._mock_response(user_prompt)

        payload = {
            "model": self._settings.nvidia_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"},
        }
        headers = {
            "Authorization": f"Bearer {self._settings.nvidia_api_key}",
            "Content-Type": "application/json",
        }
        url = f"{self._settings.nvidia_api_url.rstrip('/')}/chat/completions"

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code >= 400:
                logger.error("LLM API error: %s", response.text)
                raise LLMError(f"LLM API returned {response.status_code}")
            data = response.json()

        content = data["choices"][0]["message"]["content"]
        return self._parse_json_content(content)

    def _parse_json_content(self, content: str) -> dict[str, Any]:
        content = content.strip()
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", content, re.DOTALL)
            if match:
                return json.loads(match.group())
            raise LLMError("LLM response is not valid JSON") from None

    async def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        *,
        temperature: float = 0.3,
        max_tokens: int = 1500,
    ) -> str:
        if self._settings.llm_mock or not self._settings.nvidia_api_key:
            return self._mock_text_response(user_prompt)

        payload = {
            "model": self._settings.nvidia_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        headers = {
            "Authorization": f"Bearer {self._settings.nvidia_api_key}",
            "Content-Type": "application/json",
        }
        url = f"{self._settings.nvidia_api_url.rstrip('/')}/chat/completions"

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code >= 400:
                raise LLMError(f"LLM API returned {response.status_code}")
            data = response.json()

        return data["choices"][0]["message"]["content"].strip()

    def _mock_text_response(self, user_prompt: str) -> str:
        if "kısalt" in user_prompt.lower():
            return user_prompt.split("Metin:")[-1].strip()[: max(80, len(user_prompt) // 4)]
        return user_prompt.split("Metin:")[-1].strip()

    def _mock_response(self, user_prompt: str) -> dict[str, Any]:
        summary = user_prompt[:400].replace("\n", " ")
        body = (
            f"İlgili konuya ilişkin başvurum aşağıda özetlenmiştir.\n\n"
            f"{summary}\n\n"
            "Yukarıda belirttiğim hususların incelenerek tarafıma yazılı bilgi verilmesini "
            "ve gerekli işlemlerin yapılmasını saygılarımla arz ederim."
        )
        return {"body": body, "tone": "formal", "warnings": ["LLM mock modu aktif"]}
