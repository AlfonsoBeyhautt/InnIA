"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useProperty } from "@/context/property-context";
import { filterByProperty } from "@/lib/utils";
import { preferApi } from "@/lib/prefer-api";
import { HomeHero } from "@/components/inicio/home-hero";
import { HomeMetricCards } from "@/components/inicio/home-metric-cards";
import { HomeUpcomingArrivals } from "@/components/inicio/home-upcoming-arrivals";
import { HomeMessagesCard } from "@/components/inicio/home-messages-card";
import { HomeUrgentTasks } from "@/components/inicio/home-urgent-tasks";
import { HomeIntegrations } from "@/components/inicio/home-integrations";
import { HomeOpsSnapshot } from "@/components/inicio/home-ops-snapshot";
import { PageSection } from "@/components/motion/page-section";
import { useApi } from "@/lib/hooks/use-api";
import { useSession } from "@/lib/hooks/use-session";
import type { AppStats } from "@/lib/db/app-stats";
import type { Conversation, OperationTask, Reservation } from "@/types";


export default function InicioPage() {
  const { selectedProperty } = useProperty();
  const { user } = useSession();

  const { data: apiReservations, refetch: refetchReservations } = useApi<Reservation[]>(
    user ? "/api/reservations" : null
  );
  const { data: apiTasks, refetch: refetchTasks } = useApi<OperationTask[]>(
    user ? "/api/tasks" : null
  );
  const { data: apiConversations, refetch: refetchConversations } = useApi<Conversation[]>(
    user ? "/api/conversations" : null
  );
  const { data: appStats } = useApi<AppStats>(user ? "/api/stats" : null);

  const refetchAll = useCallback(() => {
    void refetchReservations();
    void refetchTasks();
    void refetchConversations();
  }, [refetchReservations, refetchTasks, refetchConversations]);

  useEffect(() => {
    const onReady = () => refetchAll();
    window.addEventListener("innia:data-ready", onReady);
    return () => window.removeEventListener("innia:data-ready", onReady);
  }, [refetchAll]);

  const reservations = useMemo(
    () => preferApi(apiReservations),
    [apiReservations]
  );
  const operationTasks = useMemo(() => preferApi(apiTasks), [apiTasks]);
  const conversations = useMemo(
    () => preferApi(apiConversations),
    [apiConversations]
  );

  const filteredConversations = useMemo(
    () => filterByProperty(conversations, selectedProperty),
    [conversations, selectedProperty]
  );
  const filteredReservations = useMemo(
    () => filterByProperty(reservations, selectedProperty),
    [reservations, selectedProperty]
  );
  const filteredTasks = useMemo(
    () => filterByProperty(operationTasks, selectedProperty),
    [operationTasks, selectedProperty]
  );

  const unitCount = appStats?.unitCount ?? 0;

  return (
    <div className="ci-page ci-page-wide min-h-full space-y-4 pb-8">
      <PageSection>
        <HomeHero />
      </PageSection>

      <PageSection delay={0.03}>
        <HomeMetricCards
          reservations={filteredReservations}
          conversations={filteredConversations}
          tasks={filteredTasks}
          unitCount={unitCount}
        />
      </PageSection>

      <div className="grid gap-4 lg:grid-cols-5 lg:items-stretch">
        <PageSection delay={0.05} className="lg:col-span-2">
          <HomeUpcomingArrivals reservations={filteredReservations} />
        </PageSection>
        <PageSection delay={0.06} className="lg:col-span-3">
          <HomeMessagesCard conversations={filteredConversations} />
        </PageSection>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
        <PageSection delay={0.08}>
          <HomeUrgentTasks tasks={filteredTasks} />
        </PageSection>
        <PageSection delay={0.09}>
          <HomeIntegrations />
        </PageSection>
        <PageSection delay={0.1}>
          <HomeOpsSnapshot />
        </PageSection>
      </div>
    </div>
  );
}
