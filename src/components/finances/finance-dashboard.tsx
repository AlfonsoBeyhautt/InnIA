"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { Download, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency, propertyName } from "@/lib/utils";
const financeSummary = {
  ingresos: 0,
  gastos: 0,
  gananciaNeta: 0,
  gastosLimpieza: 0,
  gastosMantenimiento: 0,
};
const monthlyRevenue: { mes: string; monto: number }[] = [];
const transactions: import("@/types").FinancialTransaction[] = [];
const financeAiInsights: {
  id: string;
  text: string;
  propertyId?: PropertyId;
  platform?: Platform;
}[] = [];
import { PlatformBadge } from "@/components/inbox/platform-badge";
import { Badge } from "@/components/ui/badge";
import { PageSection, MotionCard } from "@/components/motion/page-section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Platform, PropertyId } from "@/types";
import {
  computeProfitability,
  exportFinanceCsv,
  filterTransactions,
  hasActiveFinanceFilters,
} from "@/lib/finance-filters";
import { useToast } from "@/context/toast-context";
import { Button } from "@/components/ui/button";

const CHART_PRIMARY = "#5c6b4a";
const CHART_PRIMARY_LIGHT = "#8a9a84";
const CHART_GRID = "#e0d8ca";

const PIE_META: Record<string, { color: string; label: string }> = {
  pdd: { color: "#5c6b4a", label: "Casa Punta del Diablo" },
  rocha: { color: "#c4845a", label: "Cabaña Rocha" },
  paloma: { color: "#7a7368", label: "Apartamento La Paloma" },
};

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #e0d8ca",
  backgroundColor: "#2a2824",
  color: "#faf7f2",
  fontSize: 12,
};

export function FinanceDashboard() {
  const { toast } = useToast();
  const [propertyFilter, setPropertyFilter] = useState<PropertyId | "all">("all");
  const [monthFilter, setMonthFilter] = useState("mayo");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  const filters = useMemo(
    () => ({ property: propertyFilter, month: monthFilter, platform: platformFilter }),
    [propertyFilter, monthFilter, platformFilter]
  );

  const activeFilters = hasActiveFinanceFilters(filters);

  const filteredTx = useMemo(
    () => filterTransactions(transactions, filters),
    [filters]
  );

  const filteredProfitability = useMemo(
    () =>
      computeProfitability(
        filteredTx,
        propertyFilter,
        platformFilter,
        activeFilters || filteredTx.length > 0
      ),
    [filteredTx, propertyFilter, platformFilter, activeFilters]
  );

  const filteredInsights = useMemo(() => {
    return financeAiInsights.filter((i) => {
      if (propertyFilter !== "all" && i.propertyId && i.propertyId !== propertyFilter)
        return false;
      if (platformFilter !== "all" && i.platform && i.platform !== platformFilter)
        return false;
      return true;
    });
  }, [propertyFilter, platformFilter]);

  const metrics = useMemo(() => {
    const ingresos = filteredTx
      .filter((t) => t.type === "ingreso")
      .reduce((s, t) => s + t.amount, 0);
    const gastos = filteredTx
      .filter((t) => t.type === "gasto")
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const ganancia = ingresos - gastos;
    const margin =
      ingresos > 0 ? Math.round((ganancia / ingresos) * 100) : financeSummary.gananciaNeta;
    const useFallback = !activeFilters && filteredTx.length === 0;
    return [
      {
        label: "Ingresos",
        value: useFallback ? financeSummary.ingresos : ingresos,
        trend: "+12%",
        up: true,
      },
      {
        label: "Gastos",
        value: useFallback ? financeSummary.gastos : gastos,
        trend: "-4%",
        up: false,
      },
      {
        label: "Ganancia neta",
        value: useFallback ? financeSummary.gananciaNeta : ganancia,
        trend: "+18%",
        up: true,
      },
      {
        label: "Margen promedio",
        value: useFallback ? "74%" : `${margin}%`,
        trend: "+3 pts",
        up: true,
        isPercent: true,
      },
    ];
  }, [filteredTx, activeFilters]);

  const pieData = useMemo(() => {
    const total = filteredProfitability.reduce((s, p) => s + p.revenue, 0);
    return filteredProfitability.map((p) => ({
      id: p.id,
      name: PIE_META[p.id]?.label ?? p.name,
      value: p.revenue,
      percent: total > 0 ? Math.round((p.revenue / total) * 100) : 0,
      color: PIE_META[p.id]?.color ?? "#5c6b4a",
    }));
  }, [filteredProfitability]);

  const chartMonths = useMemo(() => {
    const ingresos = filteredTx.filter((t) => t.type === "ingreso");
    if (ingresos.length > 0) {
      const abril = ingresos
        .filter((t) => t.month === "abril")
        .reduce((s, t) => s + t.amount, 0);
      const mayo = ingresos
        .filter((t) => t.month === "mayo")
        .reduce((s, t) => s + t.amount, 0);
      if (monthFilter === "abril") return [{ mes: "Abr", monto: abril }];
      if (monthFilter === "mayo") return [{ mes: "May", monto: mayo }];
      return [
        { mes: "Abr", monto: abril },
        { mes: "May", monto: mayo },
      ];
    }
    if (monthFilter === "abril") {
      return monthlyRevenue.filter((m) => m.mes === "Abr");
    }
    if (monthFilter === "mayo") {
      return monthlyRevenue.filter((m) => m.mes === "May");
    }
    return monthlyRevenue;
  }, [filteredTx, monthFilter]);

  const monthLabel =
    monthFilter === "mayo" ? "Mayo" : monthFilter === "abril" ? "Abril" : "Todos los meses";

  return (
    <div className="ci-page ci-page-wide space-y-5">
      <PageSection>
        <header className="ci-header-band !py-4">
          <p className="text-sm font-medium text-primary">
            Finanzas · {monthLabel} 2026
            {propertyFilter !== "all" && ` · ${propertyName(propertyFilter)}`}
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">
            {monthLabel === "Mayo"
              ? "Mayo viene 18% mejor que abril"
              : monthLabel === "Abril"
                ? "Resumen financiero de abril"
                : "Panorama financiero · abril y mayo"}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Mayor margen en reservas directas y menor gasto en mantenimiento.
          </p>
        </header>
      </PageSection>

      <PageSection delay={0.03}>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/12 bg-card px-3 py-2.5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Filtros
          </span>
          <Select
            value={propertyFilter}
            onValueChange={(v) => setPropertyFilter(v as PropertyId | "all")}
          >
            <SelectTrigger className="h-8 w-[min(200px,100%)] border-primary/15 bg-background text-xs">
              <SelectValue placeholder="Propiedad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las propiedades</SelectItem>
              <SelectItem value="pdd">Casa Punta del Diablo</SelectItem>
              <SelectItem value="rocha">Cabaña Rocha</SelectItem>
              <SelectItem value="paloma">Apartamento La Paloma</SelectItem>
            </SelectContent>
          </Select>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="h-8 w-[100px] border-primary/15 bg-background text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mayo">Mayo</SelectItem>
              <SelectItem value="abril">Abril</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={platformFilter}
            onValueChange={(v) => setPlatformFilter(v as Platform | "all")}
          >
            <SelectTrigger className="h-8 w-[130px] border-primary/15 bg-background text-xs">
              <SelectValue placeholder="Plataforma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Airbnb">Airbnb</SelectItem>
              <SelectItem value="Booking">Booking</SelectItem>
              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
              <SelectItem value="Directa">Directa</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto h-8 gap-1.5 text-xs"
            onClick={() => {
              if (filteredTx.length === 0) {
                toast("No hay transacciones para exportar con estos filtros.", "info");
                return;
              }
              exportFinanceCsv(transactions, filters);
              toast(`Exportadas ${filteredTx.length} transacciones.`, "success");
            }}
          >
            <Download className="h-3.5 w-3.5" />
            Exportar
          </Button>
        </div>
      </PageSection>

      <PageSection delay={0.05}>
        <motion.div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, i) => (
            <MotionCard key={m.label} delay={i * 0.03} className="ci-metric-chip !py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {m.label}
              </p>
              <p className="mt-0.5 text-xl font-semibold text-primary">
                {m.isPercent ? m.value : formatCurrency(m.value as number)}
              </p>
              <p
                className={`mt-0.5 flex items-center gap-1 text-[11px] font-medium ${m.up ? "text-success" : "text-muted-foreground"}`}
              >
                {m.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {m.trend}
              </p>
            </MotionCard>
          ))}
        </motion.div>
      </PageSection>

      <PageSection delay={0.08}>
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="ci-surface p-4 lg:col-span-7">
            <h2 className="ci-section-title text-base">Tendencia de ingresos</h2>
            <div className="mt-3 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartMonths}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_PRIMARY_LIGHT} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={CHART_PRIMARY_LIGHT} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 11, fill: "#5c6f8a" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#5c6f8a" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                    width={48}
                  />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="monto"
                    stroke={CHART_PRIMARY_LIGHT}
                    strokeWidth={2.5}
                    fill="url(#revGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="ci-surface p-4 lg:col-span-5">
            <h2 className="ci-section-title text-base">Ingresos por propiedad</h2>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="h-40 w-full shrink-0 sm:h-44 sm:w-[44%]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={68}
                      paddingAngle={3}
                      onMouseEnter={(_, i) => setActivePieIndex(i)}
                      onMouseLeave={() => setActivePieIndex(null)}
                    >
                      {pieData.map((entry, i) => (
                        <Cell
                          key={entry.id}
                          fill={entry.color}
                          opacity={activePieIndex === null || activePieIndex === i ? 1 : 0.45}
                          stroke={activePieIndex === i ? entry.color : "transparent"}
                          strokeWidth={activePieIndex === i ? 2 : 0}
                          style={{ transition: "opacity 0.2s ease" }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={tooltipStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="min-w-0 flex-1 space-y-2.5">
                {pieData.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start gap-2.5 rounded-lg border border-primary/8 bg-warm-panel/40 px-2.5 py-2 transition-colors hover:border-primary/20"
                  >
                    <span
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="font-medium leading-snug text-foreground">{entry.name}</p>
                      <p className="mt-0.5 text-muted-foreground">
                        <span className="font-semibold text-primary">{entry.percent}%</span>
                        {" · "}
                        {formatCurrency(entry.value)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection delay={0.1}>
        <div className="ci-surface p-4">
          <h2 className="ci-section-title text-base">Rentabilidad por propiedad</h2>
          <motion.div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProfitability.map((p) => {
              const net = p.revenue - p.expenses;
              return (
                <motion.div
                  key={p.id}
                  whileHover={{ y: -2 }}
                  className="rounded-xl border border-primary/10 bg-gradient-to-br from-card to-sand/30 px-3.5 py-3"
                >
                  <p className="text-sm font-medium leading-snug">{p.name}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Ocupación {p.occupancy}% · Margen {p.margin}%
                  </p>
                  <motion.div className="mt-2.5 grid grid-cols-3 gap-1 text-[11px]">
                    <div>
                      <span className="text-muted-foreground">Ing.</span>
                      <p className="font-medium">{formatCurrency(p.revenue)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gastos</span>
                      <p className="font-medium">{formatCurrency(p.expenses)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Neto</span>
                      <p className="font-semibold text-primary">
                        {formatCurrency(net)}
                        <span className="block text-[10px] font-normal text-muted-foreground">
                          {p.trend}
                        </span>
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </PageSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <PageSection delay={0.12}>
          <div className="ci-warm-panel h-full p-4">
            <h2 className="text-sm font-semibold text-primary">Reportes financieros</h2>
            <ul className="mt-2.5 space-y-2">
              {filteredInsights.length === 0 ? (
                <li className="text-sm text-muted-foreground">Sin insights para estos filtros.</li>
              ) : (
                filteredInsights.map((insight) => (
                  <li key={insight.id} className="flex gap-2 text-sm text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {insight.text}
                  </li>
                ))
              )}
            </ul>
          </div>
        </PageSection>

        <PageSection delay={0.14}>
          <motion.div className="ci-surface overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/10 bg-warm-panel/60 px-4 py-3">
              <h2 className="text-sm font-semibold">Transacciones</h2>
              <span className="text-xs text-muted-foreground">{filteredTx.length} registros</span>
            </div>
            <ul className="max-h-[280px] divide-y divide-border/60 overflow-y-auto">
              {filteredTx.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No hay transacciones con estos filtros.
                </li>
              ) : (
                filteredTx.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-sand/30"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{t.description}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {propertyName(t.propertyId)} · {t.date}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary" className="text-[10px]">
                        {t.category}
                      </Badge>
                      {t.platform && <PlatformBadge platform={t.platform} />}
                      <span
                        className={`min-w-[64px] text-right text-sm font-semibold ${t.type === "ingreso" ? "text-success" : "text-foreground"}`}
                      >
                        {t.type === "gasto" ? "−" : ""}
                        {formatCurrency(Math.abs(t.amount))}
                      </span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        </PageSection>
      </div>
    </div>
  );
}
