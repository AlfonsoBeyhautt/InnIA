"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiPatch } from "@/lib/hooks/use-api";
import { useApi } from "@/lib/hooks/use-api";

type ProfileResponse = {
  user: { id: string; email: string | null } | null;
  profile: {
    full_name: string | null;
    company_name: string | null;
    email: string | null;
    plan: string;
  } | null;
};

export function ProfileSection() {
  const { data, loading, refetch } = useApi<ProfileResponse>("/api/profile");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (data?.profile) {
      setFullName(data.profile.full_name ?? "");
      setCompanyName(data.profile.company_name ?? "");
    }
  }, [data]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await apiPatch("/api/profile", {
        full_name: fullName,
        company_name: companyName,
      });
      setMessage("Perfil actualizado correctamente.");
      refetch();
    } catch {
      setMessage("No se pudo guardar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando perfil...
      </div>
    );
  }

  const email = data?.user?.email ?? data?.profile?.email ?? "—";
  const plan = data?.profile?.plan ?? "pro";

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Perfil y cuenta</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Datos de tu cuenta autenticada en InnIA.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-border/70 bg-white p-5 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Email</label>
          <Input value={email} disabled className="bg-sand/60" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Nombre completo</label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Tu nombre"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Empresa / marca</label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Opcional"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Plan: <span className="font-medium capitalize">{plan}</span>
        </p>
        {message && <p className="text-sm text-primary">{message}</p>}
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
