export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | 'agent'
  | 'supervisor'
  | 'inventory'
  | 'warehouse'
  | 'delivery'
  | 'sales'
  | 'admin';

export type StockStatus = 'available' | 'low' | 'out_of_stock';
export type ConversationChannel = 'whatsapp' | 'email' | 'sms' | 'facebook' | 'instagram';
export type ConversationStatus = 'active' | 'in_process' | 'completed' | 'archived';
export type MessageDirection = 'inbound' | 'outbound';

export type OrderStatus =
  | 'draft'
  | 'pending_confirmation'
  | 'confirmed'
  | 'sent_to_warehouse'
  | 'picking'
  | 'packed'
  | 'ready_for_delivery'
  | 'out_for_delivery'
  | 'delivered'
  | 'invoiced'
  | 'paid'
  | 'cancelled';

export type TicketType =
  | 'missing_item'
  | 'wrong_item'
  | 'quality'
  | 'delivery'
  | 'payment'
  | 'other';

export type TicketStatus =
  | 'new'
  | 'investigating'
  | 'waiting_for_information'
  | 'resolution_offered'
  | 'resolved'
  | 'escalated';

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: UserRole;
          avatar_url: string | null;
          is_online: boolean;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: UserRole;
          avatar_url?: string | null;
          is_online?: boolean;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: UserRole;
          avatar_url?: string | null;
          is_online?: boolean;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          name_ar: string | null;
          phone: string | null;
          whatsapp_number: string;
          email: string | null;
          address: string | null;
          delivery_zone: string | null;
          credit_limit: number;
          payment_terms: string | null;
          assigned_agent: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_ar?: string | null;
          phone?: string | null;
          whatsapp_number: string;
          email?: string | null;
          address?: string | null;
          delivery_zone?: string | null;
          credit_limit?: number;
          payment_terms?: string | null;
          assigned_agent?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_ar?: string | null;
          phone?: string | null;
          whatsapp_number?: string;
          email?: string | null;
          address?: string | null;
          delivery_zone?: string | null;
          credit_limit?: number;
          payment_terms?: string | null;
          assigned_agent?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      restaurant_contacts: {
        Row: {
          id: string;
          restaurant_id: string;
          full_name: string;
          role: string | null;
          phone: string | null;
          whatsapp: string | null;
          email: string | null;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          full_name: string;
          role?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          email?: string | null;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          full_name?: string;
          role?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          email?: string | null;
          is_primary?: boolean;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          name_ar: string | null;
          sku: string;
          category: string | null;
          unit: string;
          price: number;
          stock_status: StockStatus;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_ar?: string | null;
          sku: string;
          category?: string | null;
          unit: string;
          price?: number;
          stock_status?: StockStatus;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_ar?: string | null;
          sku?: string;
          category?: string | null;
          unit?: string;
          price?: number;
          stock_status?: StockStatus;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          restaurant_id: string | null;
          whatsapp_number: string;
          channel: ConversationChannel;
          status: ConversationStatus;
          assigned_agent: string | null;
          last_message_at: string;
          last_message: string | null;
          unread_count: number;
          sla_deadline: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id?: string | null;
          whatsapp_number: string;
          channel?: ConversationChannel;
          status?: ConversationStatus;
          assigned_agent?: string | null;
          last_message_at?: string;
          last_message?: string | null;
          unread_count?: number;
          sla_deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string | null;
          whatsapp_number?: string;
          channel?: ConversationChannel;
          status?: ConversationStatus;
          assigned_agent?: string | null;
          last_message_at?: string;
          last_message?: string | null;
          unread_count?: number;
          sla_deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          direction: MessageDirection;
          body: string | null;
          media_url: string | null;
          media_type: string | null;
          wa_message_id: string | null;
          sender_id: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          direction: MessageDirection;
          body?: string | null;
          media_url?: string | null;
          media_type?: string | null;
          wa_message_id?: string | null;
          sender_id?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          direction?: MessageDirection;
          body?: string | null;
          media_url?: string | null;
          media_type?: string | null;
          wa_message_id?: string | null;
          sender_id?: string | null;
          status?: string;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          restaurant_id: string;
          conversation_id: string | null;
          assigned_agent: string | null;
          status: OrderStatus;
          delivery_date: string | null;
          delivery_address: string | null;
          payment_terms: string | null;
          subtotal: number;
          vat_amount: number;
          total_amount: number;
          notes: string | null;
          sla_deadline: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          restaurant_id: string;
          conversation_id?: string | null;
          assigned_agent?: string | null;
          status?: OrderStatus;
          delivery_date?: string | null;
          delivery_address?: string | null;
          payment_terms?: string | null;
          subtotal?: number;
          vat_amount?: number;
          total_amount?: number;
          notes?: string | null;
          sla_deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          restaurant_id?: string;
          conversation_id?: string | null;
          assigned_agent?: string | null;
          status?: OrderStatus;
          delivery_date?: string | null;
          delivery_address?: string | null;
          payment_terms?: string | null;
          subtotal?: number;
          vat_amount?: number;
          total_amount?: number;
          notes?: string | null;
          sla_deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          name: string;
          unit: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          name: string;
          unit: string;
          quantity?: number;
          unit_price?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          name?: string;
          unit?: string;
          quantity?: number;
          unit_price?: number;
          created_at?: string;
        };
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          from_status: string | null;
          to_status: string;
          changed_by: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          from_status?: string | null;
          to_status: string;
          changed_by?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          from_status?: string | null;
          to_status?: string;
          changed_by?: string | null;
          note?: string | null;
          created_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          ticket_number: string;
          restaurant_id: string;
          order_id: string | null;
          conversation_id: string | null;
          assigned_agent: string | null;
          type: TicketType;
          status: TicketStatus;
          priority: TicketPriority;
          description: string;
          resolution: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          ticket_number?: string;
          restaurant_id: string;
          order_id?: string | null;
          conversation_id?: string | null;
          assigned_agent?: string | null;
          type: TicketType;
          status?: TicketStatus;
          priority?: TicketPriority;
          description: string;
          resolution?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          ticket_number?: string;
          restaurant_id?: string;
          order_id?: string | null;
          conversation_id?: string | null;
          assigned_agent?: string | null;
          type?: TicketType;
          status?: TicketStatus;
          priority?: TicketPriority;
          description?: string;
          resolution?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          body?: string | null;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      attachments: {
        Row: {
          id: string;
          bucket_path: string;
          file_name: string;
          file_size: number | null;
          mime_type: string | null;
          conversation_id: string | null;
          order_id: string | null;
          ticket_id: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bucket_path: string;
          file_name: string;
          file_size?: number | null;
          mime_type?: string | null;
          conversation_id?: string | null;
          order_id?: string | null;
          ticket_id?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          bucket_path?: string;
          file_name?: string;
          file_size?: number | null;
          mime_type?: string | null;
          conversation_id?: string | null;
          order_id?: string | null;
          ticket_id?: string | null;
          uploaded_by?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
