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
import { HomeInsightCarousel } from "@/components/inicio/home-insight-carousel";
import { HomeOperationsStatus } from "@/components/inicio/home-operations-status";
import { PageSection } from "@/components/motion/page-section";
import { useApi } from "@/lib/hooks/use-api";
import { useSession } from "@/lib/hooks/use-session";
import type { AppStats } from "@/lib/db/app-stats";
import type { Conversation, OperationTask, Property, Reservation } from "@/types";


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
  const { data: apiProperties } = useApi<Property[]>(user ? "/api/properties" : null);

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
  const properties = useMemo(() => preferApi(apiProperties), [apiProperties]);
  const propertiesForInsights = useMemo(
    () =>
      selectedProperty === "all"
        ? properties
        : properties.filter((p) => (p.slug ?? p.id) === selectedProperty),
    [properties, selectedProperty]
  );
  return (
    <div className="ci-page ci-page-wide min-h-full space-y-3 pb-6 lg:min-h-[calc(100dvh-76px)] lg:space-y-3 lg:px-4 lg:py-3">
      <PageSection className="shrink-0">
        <HomeHero />
      </PageSection>

      <PageSection delay={0.03} className="shrink-0">
        <HomeMetricCards
          reservations={filteredReservations}
          conversations={filteredConversations}
          tasks={filteredTasks}
          unitCount={unitCount}
        />
      </PageSection>

      <div className="grid gap-3 lg:min-h-[350px] lg:grid-cols-[1.25fr_1.35fr_0.9fr] lg:items-stretch">
        <PageSection delay={0.05} className="min-h-0">
          <HomeUpcomingArrivals reservations={filteredReservations} />
        </PageSection>
        <PageSection delay={0.06} className="min-h-0">
          <HomeMessagesCard conversations={filteredConversations} />
        </PageSection>
        <PageSection delay={0.08} className="min-h-0">
          <HomeUrgentTasks tasks={filteredTasks} />
        </PageSection>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.25fr_0.85fr_1fr] lg:items-stretch">
        <PageSection delay={0.1} className="min-h-0">
          <HomeInsightCarousel
            conversations={filteredConversations}
            reservations={filteredReservations}
            tasks={filteredTasks}
            properties={propertiesForInsights}
            unitCount={unitCount}
          />
        </PageSection>
        <PageSection delay={0.11} className="min-h-0">
          <HomeIntegrations />
        </PageSection>
        <PageSection delay={0.12} className="min-h-0">
          <HomeOperationsStatus
            reservations={filteredReservations}
            tasks={filteredTasks}
            conversations={filteredConversations}
          />
        </PageSection>
      </div>
    </div>
  );
}
