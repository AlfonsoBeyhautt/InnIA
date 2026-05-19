import {
  BarChart3,
  BedDouble,
  CalendarDays,
  CreditCard,
  Home,
  Inbox,
  KeyRound,
  Settings,
  SprayCan,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export const navigation: NavItem[] = [
  { title: "Inicio", href: "/app/inicio", icon: Home },
  { title: "Centro de mensajes", href: "/app/inbox", icon: Inbox, badge: "4" },
  { title: "Reservas", href: "/app/reservas", icon: CalendarDays },
  { title: "Propiedades", href: "/app/propiedades", icon: BedDouble },
  { title: "Limpieza y mantenimiento", href: "/app/operaciones", icon: SprayCan },
  { title: "Cerraduras", href: "/app/cerraduras", icon: KeyRound },
  { title: "Base de datos", href: "/app/crm", icon: Users },
  { title: "Finanzas", href: "/app/finanzas", icon: CreditCard },
  { title: "Reportes", href: "/app/reportes", icon: BarChart3 },
  { title: "Configuración", href: "/app/configuracion", icon: Settings },
];
