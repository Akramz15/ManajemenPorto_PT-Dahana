import {
  Briefcase,
  Shield,
  Building2,
  Factory,
  Handshake,
  MoreHorizontal,
  ArrowLeftRight,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon?: LucideIcon;
  children?: { label: string; path: string }[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

export const navConfig: Record<string, NavSection[]> = {
  "pengembangan-usaha": [
    {
      label: "Dashboard",
      items: [
        { label: "Dashboard Utama", path: "/pu/dashboard", icon: TrendingUp },
      ],
    },
    {
      label: "Komersial",
      items: [
        { label: "Project Berjalan", path: "/pu/komersial/berjalan", icon: Briefcase },
        { label: "Project Kajian", path: "/pu/komersial/kajian", icon: Briefcase },
      ],
    },
    {
      label: "Pertahanan",
      items: [
        { label: "Project Berjalan", path: "/pu/pertahanan/berjalan", icon: Shield },
        { label: "Project Kajian", path: "/pu/pertahanan/kajian", icon: Shield },
      ],
    },
    {
      label: "Lainnya",
      items: [
        { label: "Pindah Modul", path: "/select-module", icon: ArrowLeftRight },
      ],
    },
  ],
  portofolio: [
    {
      label: "Anak Cucu",
      items: [
        { label: "DIC", path: "/porto/anak-cucu/dic", icon: Building2 },
        { label: "KAN", path: "/porto/anak-cucu/kan", icon: Factory },
      ],
    },
    {
      label: "Joint Operation",
      items: [
        { label: "JODD", path: "/porto/jo/jodd", icon: Handshake },
        { label: "JODB", path: "/porto/jo/jodb", icon: Handshake },
      ],
    },
    {
      label: "Lainnya",
      items: [
        { label: "Investasi & Afiliasi", path: "/porto/lainnya", icon: MoreHorizontal },
        { label: "Pindah Modul", path: "/select-module", icon: ArrowLeftRight },
      ],
    },
  ],
};
