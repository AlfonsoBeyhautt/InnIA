import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]",
  {
    variants: {
      variant: {
        default: "border-primary/20 bg-primary/10 text-primary",
        secondary: "border-border bg-white text-muted-foreground",
        success: "border-success/25 bg-success/12 text-[#2f6f4e]",
        warning: "border-warning/30 bg-warning/12 text-[#7b4c32]",
        danger: "border-danger/30 bg-danger/12 text-[#9e3f38]",
        outline: "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
