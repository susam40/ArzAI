from weasyprint import HTML

from backend.services.template.engine import TemplateEngine


class PDFGenerator:
    def __init__(self, template_engine: TemplateEngine | None = None) -> None:
        self._template_engine = template_engine or TemplateEngine()

    def generate(self, content: str, title: str = "Dilekçe") -> bytes:
        html = self._template_engine.render_html(
            "pdf_layout.html",
            title=title,
            content=content,
        )
        return HTML(string=html).write_pdf()
