from dataclasses import dataclass
from pathlib import Path

from backend.models.schemas import TemplateFieldInfo, TemplateInfo


@dataclass(frozen=True)
class TemplateConfig:
    id: str
    institution: str
    institution_label: str
    petition_type: str
    petition_type_label: str
    subject_default: str
    institution_header: str
    template_file: str
    extra_prompt: str
    required_fields: tuple[TemplateFieldInfo, ...]


TEMPLATES_DIR = Path(__file__).resolve().parents[2] / "templates"

_COMMON_FIELDS = (
    TemplateFieldInfo(name="user_name", label="Ad Soyad", required=True),
    TemplateFieldInfo(name="id_number", label="T.C. Kimlik No", required=False),
    TemplateFieldInfo(name="address", label="Adres", required=False),
    TemplateFieldInfo(name="phone", label="Telefon", required=False),
    TemplateFieldInfo(name="email", label="E-posta", required=False),
    TemplateFieldInfo(name="date", label="Tarih", required=True),
    TemplateFieldInfo(name="subject", label="Konu", required=True),
)


def _config(
    institution: str,
    institution_label: str,
    petition_type: str,
    petition_type_label: str,
    subject_default: str,
    institution_header: str,
    template_file: str,
    extra_prompt: str = "",
    extra_fields: tuple[TemplateFieldInfo, ...] = (),
) -> TemplateConfig:
    return TemplateConfig(
        id=f"{institution}_{petition_type}",
        institution=institution,
        institution_label=institution_label,
        petition_type=petition_type,
        petition_type_label=petition_type_label,
        subject_default=subject_default,
        institution_header=institution_header,
        template_file=template_file,
        extra_prompt=extra_prompt,
        required_fields=_COMMON_FIELDS + extra_fields,
    )


TEMPLATE_REGISTRY: dict[str, TemplateConfig] = {
    "cimer_complaint": _config(
        "cimer",
        "CİMER",
        "complaint",
        "Şikayet",
        "Şikayet Başvurusu",
        "CUMHURBAŞKANLIĞI İLETİŞİM MERKEZİ (CİMER)",
        "cimer.jinja2",
        "\nBağlam: CİMER şikayet başvurusu. Net, somut ve tarafsız yaz.\n",
    ),
    "cimer_info_request": _config(
        "cimer",
        "CİMER",
        "info_request",
        "Bilgi Talebi",
        "Bilgi Edinme Başvurusu",
        "CUMHURBAŞKANLIĞI İLETİŞİM MERKEZİ (CİMER)",
        "cimer.jinja2",
        "\nBağlam: Bilgi edinme talebi. Talep edilen bilgiyi açıkça belirt.\n",
    ),
    "university_leave": _config(
        "university",
        "Üniversite",
        "leave",
        "İzin Talebi",
        "İzin Talebi",
        "REKTÖRLÜĞE",
        "university.jinja2",
        "\nBağlam: Üniversite öğrenci/personel izin talebi.\n",
        (TemplateFieldInfo(name="institution_name", label="Üniversite Adı", required=True),),
    ),
    "university_objection": _config(
        "university",
        "Üniversite",
        "objection",
        "İtiraz",
        "İtiraz Dilekçesi",
        "REKTÖRLÜĞE",
        "university.jinja2",
        "\nBağlam: Akademik/idari işleme itiraz. Gerekçeleri sıralı yaz.\n",
        (TemplateFieldInfo(name="institution_name", label="Üniversite Adı", required=True),),
    ),
    "consumer_court_complaint": _config(
        "consumer_court",
        "Tüketici Hakem Heyeti",
        "complaint",
        "Şikayet",
        "Tüketici Şikayeti",
        "TÜKETİCİ HAKEM HEYETİNE",
        "consumer_court.jinja2",
        "\nBağlam: Tüketici uyuşmazlığı. Ürün/hizmet, tarih ve talep net olsun.\n",
    ),
    "labor_law_reinstatement": _config(
        "labor_law",
        "İş Hukuku",
        "reinstatement",
        "İşe İade Talebi",
        "İşe İade Talebi",
        "İŞ MAHKEMESİNE / İŞVERENE",
        "labor_law.jinja2",
        "\nBağlam: İşe iade talebi. İşe giriş-çıkış tarihlerini kullanıcı verdiyse belirt.\n",
        (TemplateFieldInfo(name="institution_name", label="İşyeri Adı", required=True),),
    ),
    "labor_law_leave": _config(
        "labor_law",
        "İş Hukuku",
        "leave",
        "İzin Talebi",
        "İzin Talebi",
        "İŞVERENE",
        "labor_law.jinja2",
        "\nBağlam: Ücretli/ücretsiz izin talebi.\n",
        (TemplateFieldInfo(name="institution_name", label="İşyeri Adı", required=True),),
    ),
    "sgk_complaint": _config(
        "sgk",
        "SGK",
        "complaint",
        "Şikayet",
        "SGK Şikayeti",
        "SOSYAL GÜVENLİK KURUMU BAŞKANLIĞINA",
        "generic.jinja2",
        "\nBağlam: SGK hizmet/ödeme şikayeti.\n",
    ),
    "sgk_info_request": _config(
        "sgk",
        "SGK",
        "info_request",
        "Bilgi Talebi",
        "Bilgi Talebi",
        "SOSYAL GÜVENLİK KURUMU BAŞKANLIĞINA",
        "generic.jinja2",
        "\nBağlam: SGK bilgi edinme talebi.\n",
    ),
    "sgk_application": _config(
        "sgk",
        "SGK",
        "application",
        "Başvuru",
        "SGK Başvurusu",
        "SOSYAL GÜVENLİK KURUMU BAŞKANLIĞINA",
        "generic.jinja2",
        "\nBağlam: SGK başvuru dilekçesi.\n",
    ),
    "court_complaint": _config(
        "court",
        "Mahkeme",
        "complaint",
        "Şikayet",
        "Mahkeme Dilekçesi",
        "MAHKEMESİNE",
        "generic.jinja2",
        "\nBağlam: Mahkeme dilekçesi. Taraf bilgilerini kullanıcı verdiyse kullan.\n",
    ),
    "court_objection": _config(
        "court",
        "Mahkeme",
        "objection",
        "İtiraz",
        "İtiraz Dilekçesi",
        "MAHKEMESİNE",
        "generic.jinja2",
        "\nBağlam: Mahkeme itiraz dilekçesi.\n",
    ),
    "court_application": _config(
        "court",
        "Mahkeme",
        "application",
        "Başvuru",
        "Mahkeme Başvurusu",
        "MAHKEMESİNE",
        "generic.jinja2",
        "\nBağlam: Mahkeme başvuru dilekçesi.\n",
    ),
    "municipality_complaint": _config(
        "municipality",
        "Belediye",
        "complaint",
        "Şikayet",
        "Belediye Şikayeti",
        "BELEDİYE BAŞKANLIĞINA",
        "generic.jinja2",
        "\nBağlam: Belediye hizmet şikayeti.\n",
    ),
    "municipality_info_request": _config(
        "municipality",
        "Belediye",
        "info_request",
        "Bilgi Talebi",
        "Bilgi Talebi",
        "BELEDİYE BAŞKANLIĞINA",
        "generic.jinja2",
        "\nBağlam: Belediye bilgi talebi.\n",
    ),
    "employer_complaint": _config(
        "employer",
        "İşveren",
        "complaint",
        "Şikayet",
        "İşyeri Şikayeti",
        "İŞVERENE",
        "labor_law.jinja2",
        "\nBağlam: İşyeri şikayet dilekçesi.\n",
        (TemplateFieldInfo(name="institution_name", label="İşyeri Adı", required=True),),
    ),
    "employer_resignation": _config(
        "employer",
        "İşveren",
        "resignation",
        "İşten Ayrılma",
        "İşten Ayrılma Bildirimi",
        "İŞVERENE",
        "labor_law.jinja2",
        "\nBağlam: İşten ayrılma bildirimi.\n",
        (TemplateFieldInfo(name="institution_name", label="İşyeri Adı", required=True),),
    ),
    "employer_leave": _config(
        "employer",
        "İşveren",
        "leave",
        "İzin Talebi",
        "İzin Talebi",
        "İŞVERENE",
        "labor_law.jinja2",
        "\nBağlam: İşyerinden izin talebi.\n",
        (TemplateFieldInfo(name="institution_name", label="İşyeri Adı", required=True),),
    ),
    "kvkk_application": _config(
        "kvkk",
        "KVKK",
        "kvkk_request",
        "KVKK Talebi",
        "KVKK Başvurusu",
        "VERİ SORUMLUSUNA",
        "generic.jinja2",
        "\nBağlam: KVKK kapsamında veri talebi/şikayet.\n",
    ),
}


class TemplateRegistry:
    def get_config(self, institution: str, petition_type: str) -> TemplateConfig:
        key = f"{institution}_{petition_type}"
        if key not in TEMPLATE_REGISTRY:
            raise KeyError(f"Template not found: {institution}/{petition_type}")
        return TEMPLATE_REGISTRY[key]

    def list_templates(self) -> list[TemplateInfo]:
        return [
            TemplateInfo(
                id=cfg.id,
                institution=cfg.institution,
                institution_label=cfg.institution_label,
                petition_type=cfg.petition_type,
                petition_type_label=cfg.petition_type_label,
                subject_default=cfg.subject_default,
                required_fields=list(cfg.required_fields),
            )
            for cfg in TEMPLATE_REGISTRY.values()
        ]

    def templates_dir(self) -> Path:
        return TEMPLATES_DIR
