import Link from "next/link";
import { Home } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#f5f0e8] via-[#faf7f2] to-[#ebe4d6] px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2.5 transition-opacity hover:opacity-90">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-olive text-cream shadow-md shadow-olive/25">
          <Home className="h-5 w-5" />
        </div>
        <span className="text-xl font-semibold tracking-tight text-foreground">InnIA</span>
      </Link>

      <div className="w-full max-w-[420px] rounded-[22px] border border-border/80 bg-card p-8 shadow-[0_12px_40px_-12px_rgba(62,79,60,0.15)]">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
    </div>
  );
}
