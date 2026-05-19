from io import BytesIO

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt


class DocxGenerator:
    def generate(self, content: str, title: str = "Dilekçe") -> bytes:
        document = Document()
        heading = document.add_heading(title, level=1)
        heading.alignment = WD_ALIGN_PARAGRAPH.CENTER

        for paragraph_text in content.split("\n"):
            paragraph = document.add_paragraph(paragraph_text)
            for run in paragraph.runs:
                run.font.size = Pt(12)

        buffer = BytesIO()
        document.save(buffer)
        return buffer.getvalue()
