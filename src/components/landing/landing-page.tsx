"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BedDouble,
  Bot,
  CalendarDays,
  ClipboardList,
  Home,
  Inbox,
  Instagram,
  MessageCircle,
  Sparkles,
  Users,
  Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { DashboardMockup } from "@/components/landing/dashboard-mockup";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const pains = [
  "Mensajes dispersos entre WhatsApp, Instagram y plataformas",
  "Reservas desordenadas y calendarios que no conversan",
  "Huéspedes preguntando lo mismo una y otra vez",
  "Limpieza, check-in y tareas operativas a mano",
  "Riesgo real de olvidarte algo importante",
];

const features = [
  {
    icon: Inbox,
    title: "Centro de mensajes inteligente",
    desc: "Todas las conversaciones en un solo lugar, con contexto de reserva y propiedad.",
  },
  {
    icon: Bot,
    title: "IA silenciosa",
    desc: "Responde, clasifica y prioriza sin que tengas que estar encima del celular.",
  },
  {
    icon: CalendarDays,
    title: "Reservas organizadas",
    desc: "Calendario por unidad, check-ins y estados operativos claros.",
  },
  {
    icon: Users,
    title: "Huéspedes centralizados",
    desc: "Historial, documentación y comunicación vinculada a cada estadía.",
  },
  {
    icon: ClipboardList,
    title: "Limpieza y tareas",
    desc: "Kanban operativo para limpieza, mantenimiento y seguimiento del equipo.",
  },
  {
    icon: Sparkles,
    title: "Reportes simples",
    desc: "Métricas de canales, IA y campañas sin hojas de cálculo.",
  },
];

const steps = [
  {
    n: "01",
    title: "Cargá tus propiedades",
    desc: "Unidades, reglas, wifi, check-in y todo lo que la IA necesita para responder bien.",
  },
  {
    n: "02",
    title: "Conectá canales",
    desc: "WhatsApp Business, Instagram, Airbnb y Booking en un flujo unificado.",
  },
  {
    n: "03",
    title: "InnIA organiza",
    desc: "Mensajes y reservas ordenados por propiedad, urgencia e intención.",
  },
  {
    n: "04",
    title: "La IA actúa",
    desc: "Responde lo rutinario y te avisa solo cuando hace falta tu criterio.",
  },
];

const integrations = [
  { name: "WhatsApp Business", icon: MessageCircle, color: "bg-[#1A6B5C]/12 text-[#1A6B5C]" },
  { name: "Instagram", icon: Instagram, color: "bg-[#9B2335]/10 text-[#9B2335]" },
  { name: "Airbnb", icon: BedDouble, color: "bg-[#9B2335]/10 text-[#9B2335]" },
  { name: "Booking", icon: Waves, color: "bg-[#1E4A8C]/10 text-[#1E4A8C]" },
];

const useCases = [
  "Dueño con casas de verano",
  "Posada pequeña",
  "Apartamentos turísticos",
  "Propietario que alquila por temporada",
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{children}</p>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(92,107,74,0.14),transparent)]" />
        <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-terracotta/8 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-14 lg:py-24">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            className="max-w-xl"
          >
            <motion.div variants={fadeUp}>
              <SectionLabel>Copiloto para alquileres temporarios</SectionLabel>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="mt-4 text-3xl font-semibold leading-[1.12] tracking-tight text-foreground sm:text-4xl lg:text-[2.65rem]"
            >
              Administrá tus alquileres sin estar pendiente del celular
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              InnIA centraliza mensajes, reservas y huéspedes desde WhatsApp, Instagram, Airbnb y
              Booking, con IA que organiza y responde por vos.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="shadow-md shadow-primary/20">
                <Link href="/signup">
                  Crear cuenta
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#como-funciona">Ver cómo funciona</a>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.15 }}
          >
            <DashboardMockup className="ring-1 ring-border/60" />
          </motion.div>
        </div>
      </section>

      {/* Problema */}
      <section className="border-y border-border/60 bg-sand/50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="mx-auto max-w-2xl text-center"
          >
            <SectionLabel>El caos diario</SectionLabel>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Cuando todo pasa por el celular, algo se pierde
            </h2>
          </motion.div>
          <ul className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
            {pains.map((pain, i) => (
              <motion.li
                key={pain}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={{ ...fadeUp, show: { ...fadeUp.show, transition: { delay: i * 0.06 } } }}
                className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3.5 shadow-sm"
              >
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-terracotta" />
                <span className="text-sm leading-relaxed text-foreground">{pain}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* Solución */}
      <section id="funciones" className="scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="max-w-2xl"
          >
            <SectionLabel>Solución</SectionLabel>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              InnIA funciona como un copiloto operativo para tus propiedades
            </h2>
            <p className="mt-3 text-muted-foreground">
              Menos apps abiertas, menos mensajes sin responder y más claridad en cada reserva.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.article
                key={f.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={{ ...fadeUp, show: { ...fadeUp.show, transition: { delay: i * 0.05 } } }}
                className="group rounded-[22px] border border-border/70 bg-card p-6 shadow-[0_4px_24px_-12px_rgba(62,79,60,0.12)] transition-shadow hover:shadow-[0_12px_36px_-14px_rgba(62,79,60,0.16)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="scroll-mt-20 border-y border-border/60 bg-gradient-to-b from-cream to-sand/40 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center"
          >
            <SectionLabel>Cómo funciona</SectionLabel>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              De propiedades sueltas a operación ordenada
            </h2>
          </motion.div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={{ ...fadeUp, show: { ...fadeUp.show, transition: { delay: i * 0.08 } } }}
                className="relative rounded-2xl border border-border/70 bg-card p-6"
              >
                <span className="text-3xl font-bold tabular-nums text-primary/25">{s.n}</span>
                <h3 className="mt-3 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integraciones */}
      <section id="integraciones" className="scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mx-auto max-w-2xl text-center"
          >
            <SectionLabel>Integraciones</SectionLabel>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Los canales que ya usás, en un solo lugar
            </h2>
          </motion.div>

          <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
            {integrations.map((item, i) => (
              <motion.div
                key={item.name}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={{ ...fadeUp, show: { ...fadeUp.show, transition: { delay: i * 0.06 } } }}
                className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card px-5 py-4 shadow-sm"
              >
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", item.color)}>
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="font-semibold">{item.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* IA silenciosa */}
      <section className="bg-olive py-16 text-cream sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <SectionLabel>
              <span className="text-cream/70">IA silenciosa</span>
            </SectionLabel>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              La IA no solo responde
            </h2>
            <p className="mt-4 text-base leading-relaxed text-cream/85">
              También clasifica, prioriza, resume y organiza conversaciones sin que tengas que
              intervenir. InnIA detecta intención, cruza datos de la propiedad y actúa — o te
              marca lo que merece tu atención.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-cream/80">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-cream/60" />
                Clasificación automática por tipo de consulta
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-cream/60" />
                Respuestas con contexto de reserva y reglas cargadas
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-cream/60" />
                Avisos solo cuando hace falta tu decisión
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-cream/15 bg-cream/10 p-6 backdrop-blur-sm"
          >
            <div className="space-y-3">
              {[
                { label: "Nueva consulta", status: "Clasificada · check-in" },
                { label: "WhatsApp · Casa norte", status: "Respondida por IA" },
                { label: "Instagram · Fin de semana", status: "Requiere tu revisión" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-xl bg-cream/10 px-4 py-3"
                >
                  <span className="text-sm font-medium">{row.label}</span>
                  <span className="rounded-full bg-cream/15 px-2.5 py-0.5 text-[11px] text-cream/90">
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Casos de uso */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <SectionLabel>Para quién es</SectionLabel>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Pensado para operaciones reales, no para demos
            </h2>
          </motion.div>
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3">
            {useCases.map((uc, i) => (
              <motion.span
                key={uc}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={{ ...fadeUp, show: { ...fadeUp.show, transition: { delay: i * 0.05 } } }}
                className="rounded-full border border-border/70 bg-card px-5 py-2.5 text-sm font-medium shadow-sm"
              >
                {uc}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-border/60 bg-gradient-to-br from-sand via-cream to-background py-16 sm:py-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mx-auto max-w-2xl px-4 text-center sm:px-6"
        >
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Empezá a gestionar tus propiedades con menos caos
          </h2>
          <p className="mt-4 text-muted-foreground">
            Creá tu cuenta, cargá tus propiedades y conectá los canales en minutos.
          </p>
          <Button size="lg" className="mt-8 shadow-md shadow-primary/20" asChild>
            <Link href="/signup">
              Crear cuenta
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-olive text-cream">
              <Home className="h-4 w-4" />
            </div>
            <span className="font-semibold">InnIA</span>
          </div>
          <p className="text-center text-xs text-muted-foreground sm:text-left">
            Gestión de alquileres temporarios · Uruguay y Latinoamérica
          </p>
          <div className="flex gap-4 text-sm">
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              Iniciar sesión
            </Link>
            <Link href="/signup" className="font-medium text-primary hover:text-primary/80">
              Crear cuenta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
