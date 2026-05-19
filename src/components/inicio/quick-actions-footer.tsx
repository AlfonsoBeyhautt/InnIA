import Link from "next/link";
import { CalendarDays, Inbox, SprayCan } from "lucide-react";

const links = [
  { href: "/app/inbox", label: "Centro de mensajes", icon: Inbox },
  { href: "/app/reservas", label: "Reservas", icon: CalendarDays },
  { href: "/app/operaciones", label: "Operaciones", icon: SprayCan },
];

export function QuickActionsFooter() {
  return (
    <footer className="space-y-4 border-t border-border/60 pt-6">
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="ci-pill-muted gap-2 px-4 py-2 text-sm transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <l.icon className="h-4 w-4" />
            {l.label}
          </Link>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Ingresos de mayo disponibles en{" "}
        <Link href="/app/finanzas" className="font-medium text-primary hover:underline">
          Finanzas →
        </Link>
      </p>
    </footer>
  );
}
