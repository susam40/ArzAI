import {
  Building2,
  GraduationCap,
  Landmark,
  MessageSquareWarning,
  Scale,
  Shield,
  Briefcase,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface InstitutionOption {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const INSTITUTIONS: InstitutionOption[] = [
  { id: "cimer", label: "CİMER", description: "Cumhurbaşkanlığı İletişim Merkezi", icon: MessageSquareWarning },
  { id: "university", label: "Üniversite", description: "Akademik ve idari başvurular", icon: GraduationCap },
  { id: "sgk", label: "SGK", description: "Sosyal güvenlik işlemleri", icon: Shield },
  { id: "court", label: "Mahkeme", description: "Hukuki başvuru ve dilekçeler", icon: Scale },
  { id: "municipality", label: "Belediye", description: "Yerel yönetim hizmetleri", icon: Building2 },
  { id: "employer", label: "İşveren", description: "İşyeri yazışmaları", icon: Briefcase },
  { id: "consumer_court", label: "Tüketici Hakem Heyeti", description: "Tüketici uyuşmazlıkları", icon: Users },
  { id: "kvkk", label: "KVKK", description: "Kişisel veri başvuruları", icon: Landmark },
];

export const WIZARD_STORAGE_KEY = "arzai_wizard_state";
export const EDITOR_STORAGE_KEY = "arzai_editor_state";
