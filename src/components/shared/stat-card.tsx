import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: "default" | "primary" | "warning" | "success";
  className?: string;
};

const variants = {
  default: "bg-card border-border/70",
  primary: "bg-primary/5 border-primary/20",
  warning: "bg-terracotta/8 border-terracotta/20",
  success: "bg-success/8 border-success/20",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "ci-surface-static flex flex-col gap-3 border p-5 transition-all duration-300 hover:-translate-y-0.5",
        variants[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
