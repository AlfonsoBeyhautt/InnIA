/** Slug in Supabase (`pdd`, `rocha`, `paloma`) or `all` for filters */
export type PropertyId = "all" | "pdd" | "rocha" | "paloma" | (string & {});

export type Platform = "Airbnb" | "Booking" | "WhatsApp" | "Email" | "Directa";

export type Urgency = "normal" | "revisar" | "urgente";

export type ConversationLabel =
  | "Respondido por IA"
  | "Requiere revisión"
  | "Urgente"
  | "Check-in hoy"
  | "Queja"
  | "Problema mantenimiento";

export type MessageSender = "guest" | "ai" | "owner";

export type TaskStatus = "Pendiente" | "En curso" | "Completado" | "Problema detectado";

export type TaskType = "limpieza" | "mantenimiento";

export interface Property {
  id: PropertyId;
  /** UUID en Supabase */
  dbId?: string;
  slug?: string;
  name: string;
  location: string;
  image: string;
  status: "disponible" | "ocupada" | "limpieza" | "mantenimiento";
  occupancy: number;
  platforms: Platform[];
  smartLockOnline: boolean;
  wifi?: string;
  wifiName?: string;
  wifiPassword?: string;
  houseRules?: string;
  checkInInstructions?: string;
  checkOutInstructions?: string;
  description?: string;
  parkingInfo?: string;
  petPolicy?: string;
  lockInstructions?: string;
  emergencyContact?: string;
  internalNotes?: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface Unit {
  id: string;
  propertyDbId: string;
  slug: string;
  name: string;
  capacity: number;
  status: "disponible" | "ocupada" | "limpieza" | "mantenimiento";
  notes?: string;
}

export type GuestValidationStatus = "validado" | "pendiente" | "rechazado";

export interface GuestReservationHistory {
  id: string;
  propertyId: PropertyId;
  unitId: string;
  checkIn: string;
  checkOut: string;
  platform: Platform;
  amount: number;
  status: Reservation["status"];
}

export interface GuestIncident {
  date: string;
  text: string;
  severity: "baja" | "media" | "alta";
}

export interface GuestReview {
  rating: number;
  text: string;
  date: string;
  platform: Platform;
}

export interface Guest {
  id: string;
  name: string;
  fullName: string;
  email?: string;
  phone?: string;
  documentId?: string;
  documentType?: string;
  passportNumber?: string;
  nationality?: string;
  originPlatform?: Platform;
  avatar?: string;
  tags: string[];
  preferences?: string[];
  internalNotes?: string;
  observations?: string;
  validationStatus: GuestValidationStatus;
  marketingConsent: boolean;
  preferredPropertyId?: PropertyId;
  totalStays: number;
  lastStay?: string;
  reservationHistory: GuestReservationHistory[];
  paymentsTotal: number;
  incidents: GuestIncident[];
  reviews: GuestReview[];
  rentalData?: {
    purpose: string;
    emergencyContact: string;
    adults: number;
    children?: number;
  };
}

export interface Reservation {
  id: string;
  propertyId: PropertyId;
  propertyDbId?: string;
  unitId: string;
  unitDbId?: string;
  guestId: string;
  guestName: string;
  guestCount: number;
  platform: Platform;
  checkIn: string;
  checkOut: string;
  status: "confirmada" | "check-in" | "check-out" | "pendiente" | "cancelada";
  paymentStatus: "pagado" | "pendiente" | "parcial";
  lockCodeStatus: "activo" | "pendiente" | "expirado";
  amount: number;
  blocked?: boolean;
  maintenance?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: MessageSender;
  content: string;
  timestamp: string;
  aiGenerated?: boolean;
  aiAutoSent?: boolean;
}

export interface Conversation {
  id: string;
  guestId: string;
  guestName: string;
  guestAvatar?: string;
  propertyId: PropertyId;
  propertyDbId?: string;
  platform: Platform;
  aiStatus?: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: boolean;
  urgency: Urgency;
  labels: ConversationLabel[];
  messages: Message[];
  sentiment?: "positivo" | "neutral" | "negativo";
  reservationId?: string;
}

export interface OperationTask {
  id: string;
  propertyId: PropertyId;
  propertyDbId?: string;
  unitDbId?: string;
  reservationId?: string;
  description?: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  assignee?: string;
  dueDate: string;
  checklist?: { item: string; done: boolean }[];
}

export interface SmartLock {
  id: string;
  propertyId: PropertyId;
  name: string;
  online: boolean;
  battery: number;
  currentCode?: string;
  currentGuest?: string;
  validUntil?: string;
}

export interface LockAccessEvent {
  id: string;
  lockId: string;
  guest: string;
  action: string;
  timestamp: string;
}

export interface FinancialTransaction {
  id: string;
  propertyId: PropertyId;
  date: string;
  month?: string;
  description: string;
  type: "ingreso" | "gasto";
  category: string;
  platform?: Platform;
  amount: number;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  type: "operaciones" | "finanzas" | "crm" | "comunicacion";
  priority: "alta" | "media" | "baja";
  category?: string;
  source?: string;
  suggestedAction?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export type KnowledgeStatus = "completo" | "incompleto" | "faltante";

export interface KnowledgeBaseItem {
  id: string;
  propertyDbId?: string;
  topic: string;
  category?: string;
  content?: string;
  status: KnowledgeStatus;
}

export interface SuggestedAutoReply {
  id: string;
  question: string;
  preview: string;
  sourceCount: number;
}

export interface AiMissingInfoItem {
  id: string;
  message: string;
  propertyId?: PropertyId;
}

export interface ActivityItem {
  id: string;
  propertyId?: PropertyId;
  text: string;
  time: string;
  type: "mensaje" | "reserva" | "tarea" | "ia" | "cerradura";
}
