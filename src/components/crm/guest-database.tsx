"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  FileText,
  Mail,
  Phone,
  Search,
  Star,
  User,
} from "lucide-react";
import type { Guest, GuestValidationStatus } from "@/types";
import { cn, formatCurrency, propertyName } from "@/lib/utils";
import { PlatformBadge } from "@/components/inbox/platform-badge";
import { Avatar, AvatarFallback, getInitials } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { apiPatch } from "@/lib/hooks/use-api";
import { filterGuests, type GuestFilters } from "@/lib/guest-filters";
import { GuestFormDialog } from "@/components/crm/guest-form-dialog";
import { IntegrationRequiredDialog } from "@/components/shared/integration-required-dialog";

const validationVariant: Record<
  GuestValidationStatus,
  "success" | "warning" | "danger"
> = {
  validado: "success",
  pendiente: "warning",
  rechazado: "danger",
};

const validationLabel: Record<GuestValidationStatus, string> = {
  validado: "Validado",
  pendiente: "Pendiente",
  rechazado: "Rechazado",
};

export function GuestDatabase({
  guests,
  onSave,
  onFilteredChange,
  openAddSignal,
}: {
  guests: Guest[];
  onSave?: () => void;
  onFilteredChange?: (filtered: Guest[]) => void;
  /** Increment from parent to open “Agregar huésped”. */
  openAddSignal?: number;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(guests[0]?.id ?? null);
  const [mobileShowList, setMobileShowList] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [nationalityFilter, setNationalityFilter] = useState<string>("all");
  const [marketingFilter, setMarketingFilter] = useState<string>("all");
  const [recurrentFilter, setRecurrentFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [integrationOpen, setIntegrationOpen] = useState(false);

  const filterState: GuestFilters = useMemo(
    () => ({
      search,
      status: statusFilter,
      platform: platformFilter,
      property: propertyFilter,
      nationality: nationalityFilter,
      marketing: marketingFilter,
      recurrent: recurrentFilter,
    }),
    [
      search,
      statusFilter,
      platformFilter,
      propertyFilter,
      nationalityFilter,
      marketingFilter,
      recurrentFilter,
    ]
  );

  const filtered = useMemo(
    () => filterGuests(guests, filterState),
    [guests, filterState]
  );

  const nationalities = useMemo(() => {
    const set = new Set(guests.map((g) => g.nationality).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [guests]);

  useEffect(() => {
    onFilteredChange?.(filtered);
  }, [filtered, onFilteredChange]);

  useEffect(() => {
    if (openAddSignal && openAddSignal > 0) {
      setEditingGuest(null);
      setFormOpen(true);
    }
  }, [openAddSignal]);

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((g) => g.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((g) => g.id === selectedId) ?? null;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPlatformFilter("all");
    setPropertyFilter("all");
    setNationalityFilter("all");
    setMarketingFilter("all");
    setRecurrentFilter("all");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    platformFilter !== "all" ||
    propertyFilter !== "all" ||
    nationalityFilter !== "all" ||
    marketingFilter !== "all" ||
    recurrentFilter !== "all";

  return (
    <div className="relative flex min-h-[calc(100dvh-8rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-primary/12 bg-card shadow-sm max-lg:min-h-[calc(100dvh-3rem-env(safe-area-inset-top,0px))] lg:min-h-[calc(100vh-12rem)] lg:flex-row">
      <div
        className={cn(
          "flex w-full max-w-[380px] shrink-0 flex-col border-r border-border/80",
          "max-lg:absolute max-lg:inset-0 max-lg:z-[1] max-lg:max-w-none",
          !mobileShowList && "max-lg:hidden"
        )}
      >
        <div className="space-y-2 border-b border-border/80 bg-sand/60/80 p-3 max-lg:p-3 lg:space-y-3 lg:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar nombre, documento, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-border/80 bg-card pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="validado">Validado</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las plataformas</SelectItem>
                <SelectItem value="Airbnb">Airbnb</SelectItem>
                <SelectItem value="Booking">Booking</SelectItem>
                <SelectItem value="Directa">Directa</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
              </SelectContent>
            </Select>
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Propiedad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las propiedades</SelectItem>
                <SelectItem value="pdd">Casa Punta del Diablo</SelectItem>
                <SelectItem value="rocha">Cabaña Rocha</SelectItem>
                <SelectItem value="paloma">Apartamento La Paloma</SelectItem>
              </SelectContent>
            </Select>
            <Select value={nationalityFilter} onValueChange={setNationalityFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Nacionalidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {nationalities.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={marketingFilter} onValueChange={setMarketingFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Marketing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Consentimiento</SelectItem>
                <SelectItem value="yes">Aceptó marketing</SelectItem>
                <SelectItem value="no">Sin consentimiento</SelectItem>
              </SelectContent>
            </Select>
            <Select value={recurrentFilter} onValueChange={setRecurrentFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Recurrencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="yes">Huésped recurrente</SelectItem>
                <SelectItem value="no">Primera estadía</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-primary hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No hay huéspedes con estos filtros.
            </p>
          ) : (
          <ul className="divide-y divide-border/60">
            {filtered.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(g.id);
                    setMobileShowList(false);
                  }}
                  className={cn(
                    "flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-primary/5",
                    selected?.id === g.id && "bg-primary/8 ring-1 ring-inset ring-primary/20"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(g.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{g.fullName}</p>
                      <Badge
                        variant={validationVariant[g.validationStatus]}
                        className="shrink-0 text-[9px]"
                      >
                        {validationLabel[g.validationStatus]}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {g.documentId ?? "Sin documento"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {g.originPlatform && <PlatformBadge platform={g.originPlatform} />}
                      <span className="text-[10px] text-muted-foreground">
                        {g.totalStays} estadías
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          )}
        </ScrollArea>
      </div>

      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col",
          "max-lg:absolute max-lg:inset-0 max-lg:z-[2] max-lg:bg-card",
          mobileShowList && "max-lg:hidden"
        )}
      >
        {selected && (
          <button
            type="button"
            onClick={() => setMobileShowList(true)}
            className="ci-touch-target flex items-center gap-1.5 border-b border-border/80 px-3 py-2 text-xs font-medium text-muted-foreground lg:hidden"
          >
            ← Huéspedes
          </button>
        )}
        <GuestDetailPanel
          guest={selected}
          onSave={onSave}
          onEdit={() => {
            if (selected) {
              setEditingGuest(selected);
              setFormOpen(true);
            }
          }}
          onNewReservation={() => setIntegrationOpen(true)}
        />
      </div>

      <GuestFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingGuest(null);
        }}
        guest={editingGuest}
        onSaved={() => onSave?.()}
      />

      <IntegrationRequiredDialog
        open={integrationOpen}
        onOpenChange={setIntegrationOpen}
        service="calendario de reservas (Airbnb / Booking)"
        description="Crear reservas desde aquí requiere conectar tu calendario o PMS en Integraciones."
      />
    </div>
  );
}

function GuestDetailPanel({
  guest,
  onSave,
  onEdit,
  onNewReservation,
}: {
  guest: Guest | null;
  onSave?: () => void;
  onEdit?: () => void;
  onNewReservation?: () => void;
}) {
  if (!guest) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Seleccioná un huésped para ver el expediente completo
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 max-lg:p-3 lg:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/80 pb-4 max-lg:gap-2 lg:gap-4 lg:pb-5">
          <div className="flex gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/10 text-lg text-primary">
                {getInitials(guest.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{guest.fullName}</h2>
              <p className="text-sm text-muted-foreground">{guest.nationality}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant={validationVariant[guest.validationStatus]}>
                  {validationLabel[guest.validationStatus]}
                </Badge>
                {guest.originPlatform && <PlatformBadge platform={guest.originPlatform} />}
                {guest.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await apiPatch(`/api/guests/${guest.id}`, {
                    validationStatus: "validado",
                  });
                  onSave?.();
                } catch {
                  onSave?.();
                }
              }}
            >
              Marcar validado
            </Button>
            <Button size="sm" onClick={onNewReservation}>
              Nueva reserva
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/inbox">Ver mensajes</Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Section title="Contacto e identidad" icon={User}>
            <Field label="Documento / pasaporte" value={guest.documentId} />
            <Field label="Teléfono" value={guest.phone} icon={Phone} />
            <Field label="Email" value={guest.email} icon={Mail} />
            <Field label="Nacionalidad" value={guest.nationality} />
          </Section>

          <Section title="Datos para alquiler temporal" icon={FileText}>
            <Field label="Motivo de viaje" value={guest.rentalData?.purpose} />
            <Field label="Contacto de emergencia" value={guest.rentalData?.emergencyContact} />
            <Field
              label="Huéspedes"
              value={
                guest.rentalData
                  ? `${guest.rentalData.adults} adultos${guest.rentalData.children ? `, ${guest.rentalData.children} menores` : ""}`
                  : undefined
              }
            />
            <Field label="Observaciones" value={guest.observations} />
          </Section>

          <Section title="Preferencias y notas" icon={FileText}>
            {guest.preferences?.length ? (
              <ul className="space-y-1 text-sm">
                {guest.preferences.map((p) => (
                  <li key={p} className="text-foreground">
                    · {p}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sin preferencias registradas</p>
            )}
            {guest.internalNotes && (
              <>
                <Separator className="my-3" />
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Notas internas
                </p>
                <p className="mt-1 text-sm">{guest.internalNotes}</p>
              </>
            )}
          </Section>

          <Section title="Pagos y estadías" icon={FileText}>
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Total pagado" value={formatCurrency(guest.paymentsTotal)} />
              <StatBox label="Estadías" value={String(guest.totalStays)} />
              <StatBox
                label="Propiedad preferida"
                value={
                  guest.preferredPropertyId
                    ? propertyName(guest.preferredPropertyId)
                    : "—"
                }
              />
              <StatBox label="Última estadía" value={guest.lastStay ?? "—"} />
            </div>
            <div className="mt-2">
              <Badge variant={guest.marketingConsent ? "success" : "secondary"}>
                Marketing: {guest.marketingConsent ? "Consentimiento sí" : "No"}
              </Badge>
            </div>
          </Section>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Historial de reservas
          </h3>
          <div className="mt-3 overflow-hidden rounded-xl border border-border/80">
            <table className="w-full text-sm">
              <thead className="bg-sand/60 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">Propiedad</th>
                  <th className="px-4 py-2.5">Fechas</th>
                  <th className="px-4 py-2.5">Plataforma</th>
                  <th className="px-4 py-2.5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {guest.reservationHistory.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{propertyName(r.propertyId)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.checkIn} → {r.checkOut}
                    </td>
                    <td className="px-4 py-3">
                      <PlatformBadge platform={r.platform} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(r.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {guest.incidents.length > 0 && (
          <div className="mt-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              Incidentes y reportes
            </h3>
            <ul className="mt-2 space-y-2">
              {guest.incidents.map((inc, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-amber-200/80 bg-amber-50/50 px-4 py-3 text-sm"
                >
                  <span className="text-xs text-muted-foreground">{inc.date}</span>
                  <p className="mt-0.5">{inc.text}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {guest.reviews.length > 0 && (
          <div className="mt-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Star className="h-4 w-4 text-primary" />
              Reseñas recibidas
            </h3>
            <ul className="mt-2 space-y-2">
              {guest.reviews.map((rev, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-border/80 bg-card px-4 py-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <PlatformBadge platform={rev.platform} />
                    <span className="text-xs text-muted-foreground">{rev.date}</span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 font-medium">
                    {Array.from({ length: rev.rating }).map((_, j) => (
                      <Star key={j} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                  </p>
                  <p className="mt-1 text-muted-foreground">{rev.text}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-sand/60/40 p-4">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </h3>
      <div className="mt-3 space-y-2.5">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string;
  icon?: typeof Phone;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {value ?? "—"}
      </p>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
