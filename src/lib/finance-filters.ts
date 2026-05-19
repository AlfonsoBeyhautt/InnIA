import type { FinancialTransaction, Platform, PropertyId } from "@/types";
import { propertyName } from "@/lib/utils";
import { downloadCsv } from "@/lib/export-csv";
import { propertyProfitability } from "@/data/mock/operations";

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
  forceFromTx: boolean
) {
  let list =
    propertyFilter === "all"
      ? propertyProfitability
      : propertyProfitability.filter((p) => p.id === propertyFilter);

  if (!forceFromTx && filteredTx.length === 0) return list;

  list = list.map((p) => {
    const txs = filteredTx.filter((t) => t.propertyId === p.id);
    const ingresos = txs
      .filter((t) => t.type === "ingreso")
      .reduce((s, t) => s + t.amount, 0);
    const gastos = txs
      .filter((t) => t.type === "gasto")
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const margin = ingresos > 0 ? Math.round(((ingresos - gastos) / ingresos) * 100) : 0;
    return { ...p, revenue: ingresos, expenses: gastos, margin };
  });

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
