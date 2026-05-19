from datetime import date
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from backend.services.template.registry import TemplateConfig, TemplateRegistry


class TemplateEngine:
    def __init__(self, registry: TemplateRegistry | None = None) -> None:
        self._registry = registry or TemplateRegistry()
        templates_dir = self._registry.templates_dir()
        self._env = Environment(
            loader=FileSystemLoader(str(templates_dir)),
            autoescape=select_autoescape(["html", "xml"]),
            trim_blocks=True,
            lstrip_blocks=True,
        )

    def render_petition(
        self,
        config: TemplateConfig,
        *,
        subject: str,
        ai_generated_body: str,
        metadata: dict,
    ) -> str:
        context = {
            "institution_header": config.institution_header,
            "subject": subject,
            "ai_generated_body": ai_generated_body,
            "user_name": metadata.get("user_name", ""),
            "id_number": metadata.get("id_number", ""),
            "address": metadata.get("address", ""),
            "phone": metadata.get("phone", ""),
            "email": metadata.get("email", ""),
            "institution_name": metadata.get("institution_name", ""),
            "recipient_title": metadata.get("recipient_title", ""),
            "date": metadata.get("date") or date.today().isoformat(),
        }
        template = self._env.get_template(config.template_file)
        return template.render(**context).strip()

    def render_html(self, template_name: str, **context) -> str:
        template = self._env.get_template(template_name)
        return template.render(**context)

    def render_string(self, template_path: Path, **context) -> str:
        env = Environment(
            loader=FileSystemLoader(str(template_path.parent)),
            autoescape=select_autoescape(["html", "xml"]),
        )
        return env.get_template(template_path.name).render(**context)
