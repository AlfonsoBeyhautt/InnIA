"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BedDouble,
  Building2,
  Link2,
  Loader2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiPost } from "@/lib/hooks/use-api";
import { useToast } from "@/context/toast-context";
import { cn } from "@/lib/utils";

const PROPERTY_TYPES = [
  { value: "casa", label: "Casa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "posada", label: "Posada" },
  { value: "cabana", label: "Cabaña" },
];

type UnitDraft = { name: string; capacity: string; notes: string };

const stepMeta = [
  { icon: User, title: "Tus datos", subtitle: "Contanos quién gestiona las propiedades" },
  { icon: Building2, title: "Tu primera propiedad", subtitle: "Agregá al menos un alojamiento" },
  { icon: BedDouble, title: "Unidades", subtitle: "Apartamentos o habitaciones" },
  { icon: Link2, title: "Conectá tus canales", subtitle: "Centralizá tus mensajes" },
];

export function OnboardingWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    company_name: "",
  });

  const [property, setProperty] = useState({
    name: "",
    location: "",
    property_type: "apartamento",
    unit_count: "1",
    check_in_time: "15:00",
    check_out_time: "10:00",
    house_rules: "",
    wifi_name: "",
    wifi_password: "",
    parking_info: "",
    pet_policy: "",
    internal_notes: "",
  });

  const [units, setUnits] = useState<UnitDraft[]>([
    { name: "Unidad 1", capacity: "2", notes: "" },
    { name: "Unidad 2", capacity: "2", notes: "" },
  ]);

  const [whatsapp, setWhatsapp] = useState({
    enabled: false,
    phone_number_id: "",
    business_account_id: "",
    access_token: "",
    verify_token: "",
  });

  const [emailChannel, setEmailChannel] = useState({
    enabled: false,
    from_email: "",
    from_name: "",
    api_key: "",
  });

  const [airbnb, setAirbnb] = useState({ enabled: false, ical_url: "" });
  const [booking, setBooking] = useState({ enabled: false, ical_url: "" });

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user?.email) setEmail(data.user.email);
        if (data?.profile?.full_name) {
          setProfile((p) => ({
            ...p,
            full_name: data.profile.full_name ?? p.full_name,
            company_name: data.profile.company_name ?? p.company_name,
            phone: data.profile.phone ?? p.phone,
          }));
        }
      })
      .catch(() => undefined);
  }, []);

  const unitCount = Math.max(1, Number(property.unit_count) || 1);
  const showUnitsStep = unitCount > 1;

  const visibleSteps = showUnitsStep ? stepMeta : stepMeta.filter((_, i) => i !== 2);
  const currentMeta = visibleSteps[step] ?? visibleSteps[0]!;
  const Icon = currentMeta.icon;
  const isLast = step === visibleSteps.length - 1;

  const goNext = () => {
    if (step === 0 && !profile.full_name.trim()) {
      toast("Ingresá tu nombre completo.", "error");
      return;
    }
    if (step === 1 && !property.name.trim()) {
      toast("El nombre de la propiedad es obligatorio.", "error");
      return;
    }
    if (step === 1 && !property.location.trim()) {
      toast("La ubicación es obligatoria.", "error");
      return;
    }
    setStep((s) => Math.min(s + 1, visibleSteps.length - 1));
  };

  const finish = async () => {
    setLoading(true);
    try {
      const unitsPayload =
        unitCount > 1
          ? units.slice(0, unitCount).map((u) => ({
              name: u.name,
              capacity: Number(u.capacity) || 2,
              notes: u.notes || undefined,
            }))
          : undefined;

      await apiPost("/api/onboarding/complete", {
        profile: {
          full_name: profile.full_name,
          phone: profile.phone,
          company_name: profile.company_name,
        },
        property: {
          ...property,
          unit_count: unitCount,
        },
        units: unitsPayload,
        integrations: {
          ...(whatsapp.enabled
            ? {
                whatsapp: {
                  phone_number_id: whatsapp.phone_number_id,
                  business_account_id: whatsapp.business_account_id,
                  access_token: whatsapp.access_token,
                  verify_token: whatsapp.verify_token,
                },
              }
            : {}),
          ...(emailChannel.enabled
            ? {
                email: {
                  provider: "resend",
                  from_email: emailChannel.from_email,
                  from_name: emailChannel.from_name,
                  api_key: emailChannel.api_key,
                },
              }
            : {}),
          ...(airbnb.enabled && airbnb.ical_url
            ? { airbnb: { ical_url: airbnb.ical_url } }
            : {}),
          ...(booking.enabled && booking.ical_url
            ? { booking: { ical_url: booking.ical_url } }
            : {}),
        },
      });

      toast("¡Listo! Tu cuenta está configurada.", "success");
      window.dispatchEvent(new CustomEvent("innia:data-ready"));
      router.push("/app/inicio");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo completar el onboarding.", "error");
    } finally {
      setLoading(false);
    }
  };

  const stepContent = () => {
    const logicalStep = showUnitsStep ? step : step >= 2 ? step + 1 : step;

    if (logicalStep === 0) {
      return (
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="font-medium">Nombre completo *</span>
            <Input
              className="mt-1"
              value={profile.full_name}
              onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Email</span>
            <Input className="mt-1 bg-muted/50" value={email} disabled />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Teléfono</span>
            <Input
              className="mt-1"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+598 99 000 000"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Nombre comercial (opcional)</span>
            <Input
              className="mt-1"
              value={profile.company_name}
              onChange={(e) => setProfile((p) => ({ ...p, company_name: e.target.value }))}
            />
          </label>
        </div>
      );
    }

    if (logicalStep === 1) {
      return (
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          <label className="block text-sm">
            <span className="font-medium">Nombre de la propiedad *</span>
            <Input
              className="mt-1"
              value={property.name}
              onChange={(e) => setProperty((p) => ({ ...p, name: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Ubicación *</span>
            <Input
              className="mt-1"
              value={property.location}
              onChange={(e) => setProperty((p) => ({ ...p, location: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Tipo</span>
            <select
              className="mt-1 w-full rounded-lg border border-border/70 bg-white px-3 py-2 text-sm"
              value={property.property_type}
              onChange={(e) => setProperty((p) => ({ ...p, property_type: e.target.value }))}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Cantidad de unidades</span>
            <Input
              type="number"
              min={1}
              className="mt-1"
              value={property.unit_count}
              onChange={(e) => setProperty((p) => ({ ...p, unit_count: e.target.value }))}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm">
              <span className="font-medium">Check-in</span>
              <Input
                className="mt-1"
                value={property.check_in_time}
                onChange={(e) => setProperty((p) => ({ ...p, check_in_time: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Check-out</span>
              <Input
                className="mt-1"
                value={property.check_out_time}
                onChange={(e) => setProperty((p) => ({ ...p, check_out_time: e.target.value }))}
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-medium">WiFi (red y clave)</span>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <Input
                placeholder="Red"
                value={property.wifi_name}
                onChange={(e) => setProperty((p) => ({ ...p, wifi_name: e.target.value }))}
              />
              <Input
                placeholder="Clave"
                value={property.wifi_password}
                onChange={(e) => setProperty((p) => ({ ...p, wifi_password: e.target.value }))}
              />
            </div>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Reglas básicas</span>
            <Textarea
              className="mt-1"
              rows={2}
              value={property.house_rules}
              onChange={(e) => setProperty((p) => ({ ...p, house_rules: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Estacionamiento</span>
            <Textarea
              className="mt-1"
              rows={2}
              value={property.parking_info}
              onChange={(e) => setProperty((p) => ({ ...p, parking_info: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Mascotas</span>
            <Textarea
              className="mt-1"
              rows={2}
              value={property.pet_policy}
              onChange={(e) => setProperty((p) => ({ ...p, pet_policy: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Notas internas</span>
            <Textarea
              className="mt-1"
              rows={2}
              value={property.internal_notes}
              onChange={(e) => setProperty((p) => ({ ...p, internal_notes: e.target.value }))}
            />
          </label>
        </div>
      );
    }

    if (logicalStep === 2) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Cargá cada apartamento o habitación para gestionar reservas por separado.
          </p>
          {units.slice(0, unitCount).map((u, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/70 p-3 space-y-2"
            >
              <p className="text-xs font-semibold text-primary">Unidad {i + 1}</p>
              <Input
                placeholder="Nombre"
                value={u.name}
                onChange={(e) => {
                  const next = [...units];
                  next[i] = { ...next[i]!, name: e.target.value };
                  setUnits(next);
                }}
              />
              <Input
                type="number"
                min={1}
                placeholder="Capacidad"
                value={u.capacity}
                onChange={(e) => {
                  const next = [...units];
                  next[i] = { ...next[i]!, capacity: e.target.value };
                  setUnits(next);
                }}
              />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
        <ChannelCard
          title="WhatsApp Business"
          badge="Disponible"
          description="Recibí y respondé mensajes reales desde el Centro de mensajes."
          enabled={whatsapp.enabled}
          onToggle={(v) => setWhatsapp((w) => ({ ...w, enabled: v }))}
        >
          <Input
            placeholder="Phone Number ID"
            value={whatsapp.phone_number_id}
            onChange={(e) =>
              setWhatsapp((w) => ({ ...w, phone_number_id: e.target.value }))
            }
          />
          <Input
            placeholder="Business Account ID"
            value={whatsapp.business_account_id}
            onChange={(e) =>
              setWhatsapp((w) => ({ ...w, business_account_id: e.target.value }))
            }
          />
          <Input
            placeholder="Access Token"
            type="password"
            value={whatsapp.access_token}
            onChange={(e) => setWhatsapp((w) => ({ ...w, access_token: e.target.value }))}
          />
          <Input
            placeholder="Verify Token (webhook)"
            value={whatsapp.verify_token}
            onChange={(e) => setWhatsapp((w) => ({ ...w, verify_token: e.target.value }))}
          />
        </ChannelCard>

        <ChannelCard
          title="Email"
          badge="Resend"
          description="Enviá emails a huéspedes desde InnIA."
          enabled={emailChannel.enabled}
          onToggle={(v) => setEmailChannel((e) => ({ ...e, enabled: v }))}
        >
          <Input
            placeholder="Email remitente"
            value={emailChannel.from_email}
            onChange={(e) => setEmailChannel((x) => ({ ...x, from_email: e.target.value }))}
          />
          <Input
            placeholder="Nombre remitente"
            value={emailChannel.from_name}
            onChange={(e) => setEmailChannel((x) => ({ ...x, from_name: e.target.value }))}
          />
          <Input
            placeholder="API Key Resend"
            type="password"
            value={emailChannel.api_key}
            onChange={(e) => setEmailChannel((x) => ({ ...x, api_key: e.target.value }))}
          />
        </ChannelCard>

        <ChannelCard
          title="Airbnb"
          badge="Calendario iCal"
          description="Airbnb requiere acceso partner para mensajes completos. Por ahora podés sincronizar calendario mediante iCal."
          enabled={airbnb.enabled}
          onToggle={(v) => setAirbnb((a) => ({ ...a, enabled: v }))}
          muted
        >
          <Input
            placeholder="Enlace iCal de Airbnb"
            value={airbnb.ical_url}
            onChange={(e) => setAirbnb((a) => ({ ...a, ical_url: e.target.value }))}
          />
        </ChannelCard>

        <ChannelCard
          title="Booking.com"
          badge="Preparado"
          description="Booking.com requiere Connectivity API para sincronización completa. Por ahora podés preparar la conexión o usar iCal."
          enabled={booking.enabled}
          onToggle={(v) => setBooking((b) => ({ ...b, enabled: v }))}
          muted
        >
          <Input
            placeholder="Enlace iCal (si aplica)"
            value={booking.ical_url}
            onChange={(e) => setBooking((b) => ({ ...b, ical_url: e.target.value }))}
          />
        </ChannelCard>
      </div>
    );
  };

  return (
    <div className="flex min-h-[calc(100dvh-3rem)] items-center justify-center bg-sand/30 p-3 max-lg:px-3 max-lg:py-4 lg:min-h-[calc(100vh-4rem)] lg:p-6">
      <div className="w-full max-w-xl rounded-2xl border border-border/70 bg-white p-4 shadow-sm max-lg:max-h-[calc(100dvh-4rem)] max-lg:overflow-y-auto lg:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          Bienvenido a InnIA · {step + 1}/{visibleSteps.length}
        </p>
        <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <h1 className="mt-3 text-lg font-semibold lg:mt-4 lg:text-2xl">{currentMeta.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{currentMeta.subtitle}</p>

        <div className="mt-6">{stepContent()}</div>

        <div className="mt-8 flex gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              Anterior
            </Button>
          )}
          {!isLast ? (
            <Button className="ml-auto" onClick={goNext}>
              Siguiente
            </Button>
          ) : (
            <Button className="ml-auto" onClick={() => void finish()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar a InnIA"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChannelCard({
  title,
  badge,
  description,
  enabled,
  onToggle,
  children,
  muted,
}: {
  title: string;
  badge: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-2",
        enabled ? "border-primary/30 bg-primary/5" : "border-border/70",
        muted && !enabled && "opacity-90"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-sm">{title}</p>
          <span className="text-[10px] font-semibold uppercase text-primary">{badge}</span>
          <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <label className="flex items-center gap-1 text-xs shrink-0">
          <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
          Activar
        </label>
      </div>
      {enabled && <div className="space-y-2 pt-1">{children}</div>}
    </div>
  );
}
