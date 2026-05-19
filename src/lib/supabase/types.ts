export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type KnowledgeCategory =
  | "wifi"
  | "check_in"
  | "check_out"
  | "parking"
  | "pets"
  | "house_rules"
  | "lock_instructions"
  | "emergency"
  | "local_recommendations"
  | "cleaning"
  | "cancellation_policy";

export type KnowledgeStatus = "completo" | "incompleto" | "faltante";

export type IntegrationProvider =
  | "airbnb"
  | "booking"
  | "whatsapp_business"
  | "email";

export type AiDecision =
  | "auto_responder"
  | "requiere_revision"
  | "informacion_insuficiente"
  | "escalar_dueno";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          company_name: string | null;
          phone: string | null;
          plan: string;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          company_name?: string | null;
          phone?: string | null;
          plan?: string;
          onboarding_completed?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          owner_id: string;
          slug: string;
          name: string;
          location: string;
          property_type: string | null;
          description: string | null;
          image_url: string | null;
          status: string;
          occupancy: number;
          platforms: string[];
          smart_lock_online: boolean;
          check_in_time: string | null;
          check_out_time: string | null;
          wifi_name: string | null;
          wifi_password: string | null;
          parking_info: string | null;
          pet_policy: string | null;
          house_rules: string | null;
          lock_instructions: string | null;
          arrival_instructions: string | null;
          emergency_contact: string | null;
          internal_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          slug: string;
          name: string;
          location?: string;
          property_type?: string | null;
          description?: string | null;
          image_url?: string | null;
          status?: string;
          occupancy?: number;
          platforms?: string[];
          smart_lock_online?: boolean;
          check_in_time?: string | null;
          check_out_time?: string | null;
          wifi_name?: string | null;
          wifi_password?: string | null;
          parking_info?: string | null;
          pet_policy?: string | null;
          house_rules?: string | null;
          lock_instructions?: string | null;
          arrival_instructions?: string | null;
          emergency_contact?: string | null;
          internal_notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Insert"]>;
        Relationships: [];
      };
      units: {
        Row: {
          id: string;
          property_id: string;
          slug: string;
          name: string;
          capacity: number;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          slug: string;
          name: string;
          capacity?: number;
          status?: string;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["units"]["Insert"]>;
        Relationships: [];
      };
      guests: {
        Row: {
          id: string;
          owner_id: string;
          full_name: string;
          document_type: string | null;
          document_number: string | null;
          passport_number: string | null;
          nationality: string | null;
          phone: string | null;
          email: string | null;
          origin_platform: string | null;
          validation_status: string;
          marketing_consent: boolean;
          preferences: Json;
          internal_notes: string | null;
          observations: string | null;
          tags: string[];
          preferred_property_slug: string | null;
          rental_data: Json | null;
          incidents: Json;
          reviews: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          full_name: string;
          document_type?: string | null;
          document_number?: string | null;
          passport_number?: string | null;
          nationality?: string | null;
          phone?: string | null;
          email?: string | null;
          origin_platform?: string | null;
          validation_status?: string;
          marketing_consent?: boolean;
          preferences?: Json;
          internal_notes?: string | null;
          observations?: string | null;
          tags?: string[];
          preferred_property_slug?: string | null;
          rental_data?: Json | null;
          incidents?: Json;
          reviews?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["guests"]["Insert"]>;
        Relationships: [];
      };
      reservations: {
        Row: {
          id: string;
          guest_id: string;
          property_id: string;
          unit_id: string;
          platform: string;
          platform_reservation_id: string | null;
          check_in: string;
          check_out: string;
          status: string;
          payment_status: string;
          total_amount: number;
          currency: string;
          guests_count: number;
          lock_code_status: string | null;
          blocked: boolean;
          maintenance: boolean;
          source_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          guest_id: string;
          property_id: string;
          unit_id: string;
          platform?: string;
          platform_reservation_id?: string | null;
          check_in: string;
          check_out: string;
          status?: string;
          payment_status?: string;
          total_amount?: number;
          currency?: string;
          guests_count?: number;
          lock_code_status?: string | null;
          blocked?: boolean;
          maintenance?: boolean;
          source_data?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["reservations"]["Insert"]>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          owner_id: string;
          guest_id: string;
          reservation_id: string | null;
          property_id: string;
          channel: string;
          status: string;
          priority: string;
          ai_status: string | null;
          labels: string[];
          sentiment: string | null;
          last_message_preview: string | null;
          last_message_at: string | null;
          unread: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          guest_id: string;
          reservation_id?: string | null;
          property_id: string;
          channel: string;
          status?: string;
          priority?: string;
          ai_status?: string | null;
          labels?: string[];
          sentiment?: string | null;
          last_message_preview?: string | null;
          last_message_at?: string | null;
          unread?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_type: string;
          sender_name: string | null;
          body: string;
          channel: string | null;
          external_message_id: string | null;
          ai_generated: boolean;
          ai_auto_sent: boolean;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_type: string;
          sender_name?: string | null;
          body: string;
          channel?: string | null;
          external_message_id?: string | null;
          ai_generated?: boolean;
          ai_auto_sent?: boolean;
          status?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      integrations: {
        Row: {
          id: string;
          owner_id: string;
          provider: IntegrationProvider;
          status: string;
          access_token_encrypted: string | null;
          refresh_token_encrypted: string | null;
          config: Json;
          last_sync_at: string | null;
          sync_status: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          provider: IntegrationProvider;
          status?: string;
          access_token_encrypted?: string | null;
          refresh_token_encrypted?: string | null;
          config?: Json;
          last_sync_at?: string | null;
          sync_status?: string | null;
          error_message?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["integrations"]["Insert"]>;
        Relationships: [];
      };
      knowledge_base_items: {
        Row: {
          id: string;
          property_id: string;
          category: KnowledgeCategory;
          title: string;
          content: string | null;
          status: KnowledgeStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          category: KnowledgeCategory;
          title: string;
          content?: string | null;
          status?: KnowledgeStatus;
        };
        Update: Partial<Database["public"]["Tables"]["knowledge_base_items"]["Insert"]>;
        Relationships: [];
      };
      operation_tasks: {
        Row: {
          id: string;
          owner_id: string;
          property_id: string;
          unit_id: string | null;
          reservation_id: string | null;
          type: string;
          title: string;
          description: string | null;
          assigned_to: string | null;
          status: string;
          priority: string | null;
          due_date: string | null;
          checklist: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          property_id: string;
          unit_id?: string | null;
          reservation_id?: string | null;
          type: string;
          title: string;
          description?: string | null;
          assigned_to?: string | null;
          status?: string;
          priority?: string | null;
          due_date?: string | null;
          checklist?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["operation_tasks"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          owner_id: string;
          type: string;
          title: string;
          body: string;
          read: boolean;
          related_entity_type: string | null;
          related_entity_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          type: string;
          title: string;
          body: string;
          read?: boolean;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      ai_response_logs: {
        Row: {
          id: string;
          conversation_id: string;
          message_id: string | null;
          generated_response: string;
          used_knowledge: Json;
          missing_information: Json;
          ai_decision: AiDecision;
          auto_sent: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          message_id?: string | null;
          generated_response: string;
          used_knowledge?: Json;
          missing_information?: Json;
          ai_decision: AiDecision;
          auto_sent?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["ai_response_logs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
