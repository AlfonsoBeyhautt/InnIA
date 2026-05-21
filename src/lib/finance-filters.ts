import type { FinancialTransaction, Platform, PropertyId } from "@/types";
import { propertyName } from "@/lib/utils";
import { downloadCsv } from "@/lib/export-csv";
export type FinanceFilters = {
  property: PropertyId | "all";
  month: string;
  platform: Platform | "all";
};

export function hasActiveFinanceFilters(filters: FinanceFilters): boolean {
  return (
    filters.property !== "all" ||
    filters.month !== "mayo" ||
    filters.platform !== "all"
  );
}

export function filterTransactions(
  transactions: FinancialTransaction[],
  filters: FinanceFilters
): FinancialTransaction[] {
  return transactions.filter((t) => {
    if (filters.property !== "all" && t.propertyId !== filters.property) return false;
    if (t.month && t.month !== filters.month) return false;
    if (filters.platform !== "all") {
      if (t.type === "gasto" && !t.platform) return true;
      if (t.platform !== filters.platform) return false;
    }
    return true;
  });
}

export function computeProfitability(
  filteredTx: FinancialTransaction[],
  propertyFilter: PropertyId | "all",
  platformFilter: Platform | "all",
  _forceFromTx: boolean
) {
  if (filteredTx.length === 0) return [];

  const byProperty = new Map<
    string,
    { id: PropertyId; name: string; revenue: number; expenses: number; margin: number }
  >();

  for (const t of filteredTx) {
    if (propertyFilter !== "all" && t.propertyId !== propertyFilter) continue;
    if (platformFilter !== "all") {
      if (t.type === "gasto" && !t.platform) {
        /* gastos sin plataforma se incluyen */
      } else if (t.platform !== platformFilter) {
        continue;
      }
    }
    const pid = t.propertyId;
    const entry = byProperty.get(pid) ?? {
      id: pid,
      name: propertyName(pid),
      revenue: 0,
      expenses: 0,
      margin: 0,
    };
    if (t.type === "ingreso") entry.revenue += t.amount;
    else entry.expenses += Math.abs(t.amount);
    byProperty.set(pid, entry);
  }

  let list = [...byProperty.values()].map((p) => ({
    ...p,
    margin: p.revenue > 0 ? Math.round(((p.revenue - p.expenses) / p.revenue) * 100) : 0,
  }));

  if (platformFilter !== "all") {
    list = list.filter((p) =>
      filteredTx.some(
        (t) =>
          t.propertyId === p.id &&
          (t.platform === platformFilter || t.type === "gasto")
      )
    );
  }

  return list;
}

export function exportFinanceCsv(
  transactions: FinancialTransaction[],
  filters: FinanceFilters
) {
  const filtered = filterTransactions(transactions, filters);
  const monthLabel = filters.month === "abril" ? "abril" : "mayo";
  downloadCsv(
    `finanzas-${monthLabel}`,
    ["Fecha", "Descripción", "Propiedad", "Tipo", "Categoría", "Plataforma", "Monto"],
    filtered.map((t) => [
      t.date,
      t.description,
      propertyName(t.propertyId),
      t.type,
      t.category,
      t.platform ?? "",
      String(t.type === "gasto" ? -Math.abs(t.amount) : t.amount),
    ])
  );
}
