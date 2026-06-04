import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-xl border border-border/75 bg-card/85 px-3 text-sm shadow-[0_1px_0_rgba(255,255,255,0.75)_inset] outline-none transition-colors placeholder:text-muted-foreground/80 focus:border-primary/45 focus:bg-card focus:ring-2 focus:ring-primary/12",
        className
      )}
      {...props}
    />
  );
}
