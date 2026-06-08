"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileWarning, Landmark, ReceiptText, ShieldCheck } from "lucide-react";
import { PageSection } from "@/components/motion/page-section";
import { PlatformBadge } from "@/components/inbox/platform-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi } from "@/lib/hooks/use-api";
import { useSession } from "@/lib/hooks/use-session";
import { preferApi } from "@/lib/prefer-api";
import { downloadCsv } from "@/lib/export-csv";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/context/toast-context";
import type { Platform, Property, PropertyId, Reservation } from "@/types";

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid #d7ccb9",
  backgroundColor: "#292720",
  color: "#fffdf8",
  fontSize: 12,
};

function monthKey(date: string) {
  return new Intl.DateTimeFormat("es-UY", { month: "short" }).format(
    new Date(`${date}T12:00:00`)
  );
}

function propertyLabel(properties: Property[], id: PropertyId) {
  return properties.find((p) => p.id === id || p.slug === id)?.name ?? id;
}

export function FinanceDashboard() {
  const { toast } = useToast();
  const { user } = useSession();
  const { data: apiProperties } = useApi<Property[]>(user ? "/api/properties" : null, []);
  const { data: apiReservations } = useApi<Reservation[]>(user ? "/api/reservations" : null, []);
  const properties = preferApi(apiProperties);
  const reservations = preferApi(apiReservations);
  const [propertyFilter, setPropertyFilter] = useState<PropertyId | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | Reservation["paymentStatus"]>("all");

  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      if (propertyFilter !== "all" && r.propertyId !== propertyFilter) return false;
      if (platformFilter !== "all" && r.platform !== platformFilter) return false;
      if (statusFilter !== "all" && r.paymentStatus !== statusFilter) return false;
      return r.status !== "cancelada";
    });
  }, [reservations, propertyFilter, platformFilter, statusFilter]);

  const totalRevenue = filteredReservations.reduce((sum, r) => sum + r.amount, 0);
  const paidRevenue = filteredReservations
    .filter((r) => r.paymentStatus === "pagado")
    .reduce((sum, r) => sum + r.amount, 0);
  const receivables = filteredReservations
    .filter((r) => r.paymentStatus !== "pagado")
    .reduce((sum, r) => sum + r.amount, 0);
  const collectionRate = totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 100) : 0;

  const revenueByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filteredReservations) {
      const key = monthKey(r.checkIn);
      map.set(key, (map.get(key) ?? 0) + r.amount);
    }
    return [...map.entries()].map(([month, revenue]) => ({ month, revenue }));
  }, [filteredReservations]);

  const propertyRows = useMemo(() => {
    const map = new Map<PropertyId, { revenue: number; reservations: number; receivables: number }>();
    for (const r of filteredReservations) {
      const current = map.get(r.propertyId) ?? { revenue: 0, reservations: 0, receivables: 0 };
      current.revenue += r.amount;
      current.reservations += 1;
      if (r.paymentStatus !== "pagado") current.receivables += r.amount;
      map.set(r.propertyId, current);
    }
    return [...map.entries()]
      .map(([id, row]) => ({ id, name: propertyLabel(properties, id), ...row }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredReservations, properties]);

  const platformRows = useMemo(() => {
    const map = new Map<Platform, number>();
    for (const r of filteredReservations) {
      map.set(r.platform, (map.get(r.platform) ?? 0) + r.amount);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [filteredReservations]);

  const exportCsv = () => {
    if (filteredReservations.length === 0) {
      toast("No hay reservas financieras para exportar con estos filtros.", "info");
      return;
    }
    downloadCsv(
      "finanzas-reservas",
      ["Huésped", "Propiedad", "Plataforma", "Check-in", "Check-out", "Estado cobro", "Importe"],
      filteredReservations.map((r) => [
        r.guestName,
        propertyLabel(properties, r.propertyId),
        r.platform,
        r.checkIn,
        r.checkOut,
        r.paymentStatus,
        String(r.amount),
      ])
    );
    toast(`Exportadas ${filteredReservations.length} reservas financieras.`, "success");
  };

  return (
    <div className="ci-page ci-page-wide space-y-6">
      <PageSection>
        <header className="border-b border-border/80 pb-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Control financiero
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">Finanzas</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Lectura ejecutiva de ingresos, cobros pendientes y exposición por propiedad.
                Datos calculados desde reservas activas; el ledger contable completo queda como
                siguiente capa operativa.
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={exportCsv}>
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </header>
      </PageSection>

      <PageSection delay={0.03}>
        <div className="flex flex-wrap items-center gap-2 border-b border-border/70 pb-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Filtros
          </span>
          <Select
            value={propertyFilter}
            onValueChange={(v) => setPropertyFilter(v as PropertyId | "all")}
          >
            <SelectTrigger className="h-9 w-[220px] bg-white text-xs">
              <SelectValue placeholder="Propiedad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las propiedades</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={platformFilter} onValueChange={(v) => setPlatformFilter(v as Platform | "all")}>
            <SelectTrigger className="h-9 w-[150px] bg-white text-xs">
              <SelectValue placeholder="Plataforma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Airbnb">Airbnb</SelectItem>
              <SelectItem value="Booking">Booking</SelectItem>
              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="Directa">Directa</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as "all" | Reservation["paymentStatus"])}
          >
            <SelectTrigger className="h-9 w-[150px] bg-white text-xs">
              <SelectValue placeholder="Cobro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los cobros</SelectItem>
              <SelectItem value="pagado">Pagado</SelectItem>
              <SelectItem value="parcial">Parcial</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageSection>

      <PageSection delay={0.05}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Ingresos por reservas", value: formatCurrency(totalRevenue), sub: `${filteredReservations.length} reservas`, icon: Landmark },
            { label: "Cobrado", value: formatCurrency(paidRevenue), sub: `${collectionRate}% del total`, icon: ShieldCheck },
            { label: "Por cobrar", value: formatCurrency(receivables), sub: "pendiente/parcial", icon: ReceiptText },
            { label: "Ledger contable", value: "Pendiente", sub: "conectar gastos y pagos", icon: FileWarning },
          ].map((item) => (
            <div key={item.label} className="border-b border-border/80 bg-white px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.sub}</p>
                </div>
                <item.icon className="h-4 w-4 text-primary" />
              </div>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection delay={0.08}>
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
          <section className="min-h-[320px] border-b border-border/80 pb-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Ingresos reconocidos</h2>
                <p className="text-sm text-muted-foreground">Agrupado por mes de check-in.</p>
              </div>
              <Badge variant={filteredReservations.length > 0 ? "success" : "warning"}>
                {filteredReservations.length > 0 ? "Con datos" : "Sin reservas"}
              </Badge>
            </div>
            {revenueByMonth.length === 0 ? (
              <PremiumFinanceEmpty />
            ) : (
              <div className="h-72 rounded-2xl border border-border/70 bg-white p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByMonth}>
                    <CartesianGrid stroke="#e5dccd" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={64}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={tooltipStyle}
                    />
                    <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="#354633" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="border-b border-border/80 pb-5">
            <h2 className="text-lg font-semibold tracking-tight">Exposición por canal</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ingresos asociados a cada origen.</p>
            <div className="mt-4 space-y-3">
              {platformRows.length === 0 ? (
                <PremiumFinanceEmpty compact />
              ) : (
                platformRows.map(([platform, value]) => {
                  const pct = totalRevenue > 0 ? Math.round((value / totalRevenue) * 100) : 0;
                  return (
                    <div key={platform} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <PlatformBadge platform={platform} />
                        <span className="font-semibold tabular-nums">{formatCurrency(value)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-olive" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[11px] text-muted-foreground">{pct}% del total filtrado</p>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </PageSection>

      <PageSection delay={0.1}>
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <section>
            <h2 className="text-lg font-semibold tracking-tight">Rendimiento por propiedad</h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-border/70 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-warm-panel text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Propiedad</th>
                    <th className="px-4 py-3 text-right font-semibold">Reservas</th>
                    <th className="px-4 py-3 text-right font-semibold">Ingresos</th>
                    <th className="px-4 py-3 text-right font-semibold">Por cobrar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {propertyRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8">
                        <PremiumFinanceEmpty compact />
                      </td>
                    </tr>
                  ) : (
                    propertyRows.map((row) => (
                      <tr key={row.id} className="hover:bg-sand/35">
                        <td className="px-4 py-3 font-medium">{row.name}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.reservations}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatCurrency(row.receivables)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight">Ledger de reservas</h2>
            <div className="mt-3 max-h-[360px] overflow-auto rounded-2xl border border-border/70 bg-white">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-warm-panel text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Huésped</th>
                    <th className="px-4 py-3 text-left font-semibold">Cobro</th>
                    <th className="px-4 py-3 text-right font-semibold">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8">
                        <PremiumFinanceEmpty compact />
                      </td>
                    </tr>
                  ) : (
                    filteredReservations.map((reservation) => (
                      <tr key={reservation.id} className="hover:bg-sand/35">
                        <td className="px-4 py-3">
                          <p className="font-medium">{reservation.guestName}</p>
                          <p className="text-xs text-muted-foreground">
                            {propertyLabel(properties, reservation.propertyId)} · {reservation.checkIn}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              reservation.paymentStatus === "pagado"
                                ? "success"
                                : reservation.paymentStatus === "parcial"
                                  ? "warning"
                                  : "danger"
                            }
                          >
                            {reservation.paymentStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {formatCurrency(reservation.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </PageSection>
    </div>
  );
}

function PremiumFinanceEmpty({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "text-sm text-muted-foreground" : "flex h-full min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-border bg-white p-6 text-center"}>
      <div>
        <p className="font-semibold text-foreground">Sin datos para este filtro</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Cuando existan reservas o cobros asociados, InnIA mostrará ingresos reconocidos,
          exposición por canal y saldos pendientes.
        </p>
      </div>
    </div>
  );
}
