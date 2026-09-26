-- ==============================================================================
-- Sowtek OrderFlow - Initial Database Schema Migration
-- Migration: 001_initial_schema.sql
-- Stack: Supabase (PostgreSQL 15+) / Next.js 14 App Router
-- ==============================================================================

-- Enable UUID and pgcrypto extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PROFILES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('agent', 'supervisor', 'inventory', 'warehouse', 'delivery', 'sales', 'admin')),
    avatar_url TEXT,
    is_online BOOLEAN NOT NULL DEFAULT false,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth.users with operational roles and status.';

-- ==============================================================================
-- 2. RESTAURANTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT,
    phone TEXT,
    whatsapp_number TEXT UNIQUE NOT NULL,
    email TEXT,
    address TEXT,
    delivery_zone TEXT,
    credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_terms TEXT,
    assigned_agent UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.restaurants IS 'Restaurant customer accounts with credit limits, zones, and assigned agents.';

-- ==============================================================================
-- 3. RESTAURANT CONTACTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.restaurant_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.restaurant_contacts IS 'Key contact persons for each restaurant customer.';

-- ==============================================================================
-- 4. PRODUCTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT,
    sku TEXT UNIQUE NOT NULL,
    category TEXT,
    unit TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    stock_status TEXT NOT NULL DEFAULT 'available' CHECK (stock_status IN ('available', 'low', 'out_of_stock')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.products IS 'Wholesale grocery catalog items with SKU, unit pricing, and inventory status.';

-- ==============================================================================
-- 5. CONVERSATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
    whatsapp_number TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'email', 'sms', 'facebook', 'instagram')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_process', 'completed', 'archived')),
    assigned_agent UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_message TEXT,
    unread_count INTEGER NOT NULL DEFAULT 0,
    sla_deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.conversations IS 'Omnichannel/WhatsApp customer conversation threads and SLA tracking.';

-- ==============================================================================
-- 6. MESSAGES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    body TEXT,
    media_url TEXT,
    media_type TEXT,
    wa_message_id TEXT UNIQUE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.messages IS 'Inbound and outbound messages across conversations.';

-- ==============================================================================
-- 7. ORDERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE RESTRICT,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    assigned_agent UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft',
        'pending_confirmation',
        'confirmed',
        'sent_to_warehouse',
        'picking',
        'packed',
        'ready_for_delivery',
        'out_for_delivery',
        'delivered',
        'invoiced',
        'paid',
        'cancelled'
    )),
    delivery_date DATE,
    delivery_address TEXT,
    payment_terms TEXT,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    vat_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    sla_deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.orders IS 'Wholesale restaurant supply orders with 12-stage lifecycle and SLA tracking.';

-- ==============================================================================
-- 8. ORDER ITEMS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.order_items IS 'Item line snapshots for orders with stored computed totals.';

-- ==============================================================================
-- 9. ORDER STATUS HISTORY TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.order_status_history IS 'Audit trail tracking state transitions across order lifecycles.';

-- ==============================================================================
-- 10. TICKETS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    assigned_agent UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('missing_item', 'wrong_item', 'quality', 'delivery', 'payment', 'other')),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'waiting_for_information', 'resolution_offered', 'resolved', 'escalated')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    description TEXT NOT NULL,
    resolution TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ
);

COMMENT ON TABLE public.tickets IS 'Customer support tickets and fulfillment escalations.';

-- ==============================================================================
-- 11. NOTIFICATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.notifications IS 'Operational alerts, SLA breach warnings, and user notifications.';

-- ==============================================================================
-- 12. ATTACHMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.attachments IS 'Metadata references to documents, invoices, media, and images stored in Supabase Storage.';

-- ==============================================================================
-- A. SEQUENCES AND AUTO-GENERATION TRIGGERS
-- ==============================================================================

-- 1. Order Number Sequence (starting at 1000 -> ORD-1000)
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1000;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'ORD-' || nextval('public.order_number_seq')::TEXT;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_order_number ON public.orders;
CREATE TRIGGER trg_set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_order_number();

-- 2. Ticket Number Sequence (starting at 100 -> TKT-100)
CREATE SEQUENCE IF NOT EXISTS public.ticket_number_seq START WITH 100;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number := 'TKT-' || nextval('public.ticket_number_seq')::TEXT;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_ticket_number ON public.tickets;
CREATE TRIGGER trg_set_ticket_number
BEFORE INSERT ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.generate_ticket_number();

-- ==============================================================================
-- B. UPDATED_AT TIMESTAMP TRIGGERS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_restaurants_updated_at ON public.restaurants;
CREATE TRIGGER trg_restaurants_updated_at
BEFORE UPDATE ON public.restaurants
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile record upon auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'agent'),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        avatar_url = EXCLUDED.avatar_url;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- C. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. PROFILES POLICIES
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile or admins/supervisors can update any"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id OR public.is_admin_or_supervisor())
    WITH CHECK (auth.uid() = id OR public.is_admin_or_supervisor());

-- 2. RESTAURANTS POLICIES
CREATE POLICY "Supervisors and admins can manage all restaurants"
    ON public.restaurants FOR ALL
    TO authenticated
    USING (public.is_admin_or_supervisor());

CREATE POLICY "Agents can view restaurants assigned to them or unassigned"
    ON public.restaurants FOR SELECT
    TO authenticated
    USING (assigned_agent = auth.uid() OR assigned_agent IS NULL OR public.is_admin_or_supervisor());

CREATE POLICY "Agents can update restaurants assigned to them"
    ON public.restaurants FOR UPDATE
    TO authenticated
    USING (assigned_agent = auth.uid() OR public.is_admin_or_supervisor())
    WITH CHECK (assigned_agent = auth.uid() OR public.is_admin_or_supervisor());

CREATE POLICY "Agents can create restaurants"
    ON public.restaurants FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 3. RESTAURANT CONTACTS POLICIES
CREATE POLICY "Contacts viewable by authenticated users with restaurant access"
    ON public.restaurant_contacts FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants r
            WHERE r.id = restaurant_contacts.restaurant_id
            AND (r.assigned_agent = auth.uid() OR r.assigned_agent IS NULL OR public.is_admin_or_supervisor())
        )
    );

CREATE POLICY "Contacts manageable by authorized restaurant staff"
    ON public.restaurant_contacts FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurants r
            WHERE r.id = restaurant_contacts.restaurant_id
            AND (r.assigned_agent = auth.uid() OR public.is_admin_or_supervisor())
        )
    );

-- 4. PRODUCTS POLICIES
CREATE POLICY "Products are viewable by all authenticated users"
    ON public.products FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Products manageable by inventory managers, supervisors, and admins"
    ON public.products FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'supervisor', 'inventory')
        )
    );

-- 5. CONVERSATIONS POLICIES
CREATE POLICY "Supervisors and admins have full access to conversations"
    ON public.conversations FOR ALL
    TO authenticated
    USING (public.is_admin_or_supervisor());

CREATE POLICY "Agents can view assigned or unassigned conversations"
    ON public.conversations FOR SELECT
    TO authenticated
    USING (assigned_agent = auth.uid() OR assigned_agent IS NULL OR public.is_admin_or_supervisor());

CREATE POLICY "Agents can update assigned conversations"
    ON public.conversations FOR UPDATE
    TO authenticated
    USING (assigned_agent = auth.uid() OR public.is_admin_or_supervisor())
    WITH CHECK (assigned_agent = auth.uid() OR public.is_admin_or_supervisor());

CREATE POLICY "Agents can create conversations"
    ON public.conversations FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 6. MESSAGES POLICIES
CREATE POLICY "Supervisors and admins can view all messages"
    ON public.messages FOR SELECT
    TO authenticated
    USING (public.is_admin_or_supervisor());

CREATE POLICY "Agents can view messages of accessible conversations"
    ON public.messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
            AND (c.assigned_agent = auth.uid() OR c.assigned_agent IS NULL OR public.is_admin_or_supervisor())
        )
    );

CREATE POLICY "Authenticated users can insert messages into conversations"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
            AND (c.assigned_agent = auth.uid() OR c.assigned_agent IS NULL OR public.is_admin_or_supervisor())
        )
    );

-- 7. ORDERS POLICIES
CREATE POLICY "Supervisors, admins, warehouse, delivery can view all orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'supervisor', 'warehouse', 'delivery', 'inventory', 'sales')
        )
    );

CREATE POLICY "Agents can view assigned orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (assigned_agent = auth.uid() OR public.is_admin_or_supervisor());

CREATE POLICY "Staff can create orders"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Staff can update assigned orders or with elevated roles"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (
        assigned_agent = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'supervisor', 'warehouse', 'delivery', 'inventory')
        )
    );

-- 8. ORDER ITEMS POLICIES
CREATE POLICY "Order items viewable with order access"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND (o.assigned_agent = auth.uid() OR public.is_admin_or_supervisor() OR EXISTS (
                SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('warehouse', 'delivery', 'inventory')
            ))
        )
    );

CREATE POLICY "Order items manageable by order creator or authorized staff"
    ON public.order_items FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND (o.assigned_agent = auth.uid() OR public.is_admin_or_supervisor())
        )
    );

-- 9. ORDER STATUS HISTORY POLICIES
CREATE POLICY "Status history viewable with order access"
    ON public.order_status_history FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_status_history.order_id
            AND (o.assigned_agent = auth.uid() OR public.is_admin_or_supervisor() OR EXISTS (
                SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('warehouse', 'delivery')
            ))
        )
    );

CREATE POLICY "Authenticated users can record status history"
    ON public.order_status_history FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 10. TICKETS POLICIES
CREATE POLICY "Supervisors and admins can manage all tickets"
    ON public.tickets FOR ALL
    TO authenticated
    USING (public.is_admin_or_supervisor());

CREATE POLICY "Agents can view assigned or unassigned tickets"
    ON public.tickets FOR SELECT
    TO authenticated
    USING (assigned_agent = auth.uid() OR assigned_agent IS NULL OR public.is_admin_or_supervisor());

CREATE POLICY "Agents can update assigned tickets"
    ON public.tickets FOR UPDATE
    TO authenticated
    USING (assigned_agent = auth.uid() OR public.is_admin_or_supervisor())
    WITH CHECK (assigned_agent = auth.uid() OR public.is_admin_or_supervisor());

CREATE POLICY "Authenticated users can create tickets"
    ON public.tickets FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 11. NOTIFICATIONS POLICIES
CREATE POLICY "Users can only view their own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin_or_supervisor());

CREATE POLICY "Users can update read status of their own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users or system triggers can create notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 12. ATTACHMENTS POLICIES
CREATE POLICY "Attachments viewable by authenticated users"
    ON public.attachments FOR SELECT
    TO authenticated
    USING (uploaded_by = auth.uid() OR public.is_admin_or_supervisor() OR true);

CREATE POLICY "Users can upload attachments"
    ON public.attachments FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ==============================================================================
-- D. PERFORMANCE INDEXES
-- ==============================================================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_agent_status ON public.conversations(assigned_agent, status);
CREATE INDEX IF NOT EXISTS idx_conversations_whatsapp ON public.conversations(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_conversations_restaurant ON public.conversations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON public.conversations(last_message_at DESC);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_agent_status ON public.orders(assigned_agent, status);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_wa_id ON public.messages(wa_message_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- Order items & tickets indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_tickets_agent_status ON public.tickets(assigned_agent, status);
CREATE INDEX IF NOT EXISTS idx_tickets_restaurant ON public.tickets(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_contacts_restaurant ON public.restaurant_contacts(restaurant_id);
