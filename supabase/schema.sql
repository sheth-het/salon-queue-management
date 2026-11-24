-- =============================================================================
-- SALON QUEUE MANAGEMENT SYSTEM - SUPABASE DATABASE SCHEMA
-- File: supabase/schema.sql
-- Description: Complete schema, constraints, indexes, RLS policies, 
--              Realtime replication, and seed data for Royal Grooming Lounge.
-- Execution: Run this entire script in Supabase Dashboard > SQL Editor.
-- =============================================================================

-- Enable required extensions for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. TABLE: salon_settings
-- Stores global salon configuration, queue open/closed status, and operating limits
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.salon_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_name TEXT NOT NULL DEFAULT 'Royal Grooming Lounge',
    is_queue_open BOOLEAN NOT NULL DEFAULT true,
    max_queue_capacity INT NOT NULL DEFAULT 25 CHECK (max_queue_capacity > 0),
    buffer_minutes INT NOT NULL DEFAULT 5 CHECK (buffer_minutes >= 0),
    avg_wait_minutes INT NOT NULL DEFAULT 22 CHECK (avg_wait_minutes >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- 2. TABLE: services
-- Master catalog of salon services, pricing in INR, duration, and bilingual titles
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_gu TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Hair',
    description_en TEXT,
    description_gu TEXT,
    duration_minutes INT NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
    price INT NOT NULL DEFAULT 200 CHECK (price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- 3. TABLE: barbers
-- Barber roster with assigned chair number and real-time duty status
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.barbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_gu TEXT,
    chair_number INT NOT NULL UNIQUE CHECK (chair_number > 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'break', 'off_duty')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- 4. TABLE: customers
-- Directory of customers for contact tracking and return visit records
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- 5. TABLE: queue_tokens
-- Core operational queue entries tracking customer wait status, assigned chair,
-- selected services snapshot, and lifecycle timestamps
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.queue_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_number TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    service_ids UUID[] NOT NULL DEFAULT '{}',
    services JSONB NOT NULL DEFAULT '[]'::jsonb,
    barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
    barber_name TEXT DEFAULT 'Any Available Stylist',
    chair_number INT,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'in_service', 'completed', 'no_show', 'cancelled')),
    source TEXT NOT NULL DEFAULT 'online' CHECK (source IN ('online', 'walk_in')),
    total_duration INT NOT NULL DEFAULT 30 CHECK (total_duration > 0),
    total_price INT NOT NULL DEFAULT 200 CHECK (total_price >= 0),
    position INT DEFAULT 1,
    estimated_wait_minutes INT DEFAULT 15,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    called_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- PERFORMANCE B-TREE INDEXES
-- Accelerates First-Come, First-Served lookups and Realtime status polling
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_queue_tokens_status ON public.queue_tokens(status);
CREATE INDEX IF NOT EXISTS idx_queue_tokens_joined_at ON public.queue_tokens(joined_at ASC);
CREATE INDEX IF NOT EXISTS idx_queue_tokens_barber ON public.queue_tokens(barber_id);
CREATE INDEX IF NOT EXISTS idx_queue_tokens_phone ON public.queue_tokens(customer_phone);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_barbers_status ON public.barbers(status);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enables security boundaries on all tables while allowing proper public/staff access
-- =============================================================================

-- 1. salon_settings RLS
ALTER TABLE public.salon_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read salon settings" ON public.salon_settings;
CREATE POLICY "Allow public read salon settings" 
    ON public.salon_settings FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow update salon settings" ON public.salon_settings;
CREATE POLICY "Allow update salon settings" 
    ON public.salon_settings FOR ALL 
    USING (true)
    WITH CHECK (true);

-- 2. services RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read services" ON public.services;
CREATE POLICY "Allow public read services" 
    ON public.services FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow manage services" ON public.services;
CREATE POLICY "Allow manage services" 
    ON public.services FOR ALL 
    USING (true)
    WITH CHECK (true);

-- 3. barbers RLS
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read barbers" ON public.barbers;
CREATE POLICY "Allow public read barbers" 
    ON public.barbers FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow manage barbers" ON public.barbers;
CREATE POLICY "Allow manage barbers" 
    ON public.barbers FOR ALL 
    USING (true)
    WITH CHECK (true);

-- 4. customers RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert customers" ON public.customers;
CREATE POLICY "Allow public insert customers" 
    ON public.customers FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read customers" ON public.customers;
CREATE POLICY "Allow public read customers" 
    ON public.customers FOR SELECT 
    USING (true);

-- 5. queue_tokens RLS
ALTER TABLE public.queue_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read queue tokens" ON public.queue_tokens;
CREATE POLICY "Allow public read queue tokens" 
    ON public.queue_tokens FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow public insert queue tokens" ON public.queue_tokens;
CREATE POLICY "Allow public insert queue tokens" 
    ON public.queue_tokens FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update queue tokens" ON public.queue_tokens;
CREATE POLICY "Allow update queue tokens" 
    ON public.queue_tokens FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- SUPABASE REALTIME PUBLICATION
-- Enables live WebSocket change broadcasts across browsers
-- (Idempotent: safe to run multiple times without throwing duplicate errors)
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'salon_settings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.salon_settings;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'services'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'barbers'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.barbers;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'queue_tokens'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_tokens;
    END IF;
END $$;

-- =============================================================================
-- INITIAL SEED DATA
-- Pre-populates the salon profile, services, barbers, and initial demo tokens
-- =============================================================================

-- 1. Initial Salon Settings
INSERT INTO public.salon_settings (id, salon_name, is_queue_open, max_queue_capacity, buffer_minutes, avg_wait_minutes)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Royal Grooming Lounge',
    true,
    25,
    5,
    22
) ON CONFLICT (id) DO UPDATE SET
    salon_name = EXCLUDED.salon_name,
    is_queue_open = EXCLUDED.is_queue_open,
    max_queue_capacity = EXCLUDED.max_queue_capacity,
    buffer_minutes = EXCLUDED.buffer_minutes;

-- 2. Initial Services Catalog
INSERT INTO public.services (id, name_en, name_gu, category, description_en, description_gu, duration_minutes, price, is_active)
VALUES 
    ('10000000-0000-0000-0000-000000000001', 'Haircut & Styling', 'હેરકટ અને સ્ટાઇલિંગ', 'Hair', 'Precision cut, wash, and blow dry styling', 'પ્રીમિયમ હેરકટ, શેમ્પૂ વોશ અને બ્લો ડ્રાય', 30, 250, true),
    ('10000000-0000-0000-0000-000000000002', 'Beard Grooming & Shape', 'દાઢી ટ્રીમિંગ અને શેપિંગ', 'Beard', 'Hot towel beard trim, shape, and conditioning oil', 'હોટ ટુવાલ શેવિંગ, શેપ અને તેલ માલિશ', 20, 150, true),
    ('10000000-0000-0000-0000-000000000003', 'Royal Head Massage', 'રોયલ માથાની માલિશ', 'Spa', 'Relaxing scalp massage with Ayurvedic herbal oils', 'આયુર્વેદિક તેલ સાથે આરામદાયક માથાની માલિશ', 25, 200, true),
    ('10000000-0000-0000-0000-000000000004', 'Charcoal Detan Facial', 'ચાર્કોલ ડી-ટેન ફેશિયલ', 'Facial', 'Deep pore cleansing, exfoliation, and charcoal mask', 'ડીપ ક્લિનિંગ, સ્ક્રબ અને ચાર્કોલ માસ્ક', 45, 500, true),
    ('10000000-0000-0000-0000-000000000005', 'Hair Color & Touchup', 'હેર કલરિંગ / ડાઈ', 'Hair', 'Organic amonia-free natural black/brown shade', 'ઓર્ગેનિક કેમિકલ વગરનો નેચરલ હેર કલર', 40, 400, true)
ON CONFLICT (id) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_gu = EXCLUDED.name_gu,
    duration_minutes = EXCLUDED.duration_minutes,
    price = EXCLUDED.price,
    is_active = EXCLUDED.is_active;

-- 3. Initial Barbers
INSERT INTO public.barbers (id, name, name_gu, chair_number, status, is_active)
VALUES 
    ('20000000-0000-0000-0000-000000000001', 'Ravi', 'રવિ', 1, 'active', true),
    ('20000000-0000-0000-0000-000000000002', 'Amit', 'અમિત', 2, 'active', true),
    ('20000000-0000-0000-0000-000000000003', 'Imran', 'ઇમરાન', 3, 'active', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_gu = EXCLUDED.name_gu,
    chair_number = EXCLUDED.chair_number,
    status = EXCLUDED.status;

-- 4. Initial Demo Queue Tokens
INSERT INTO public.queue_tokens (id, token_number, customer_name, customer_phone, barber_id, barber_name, chair_number, status, source, total_duration, total_price, position, estimated_wait_minutes, services)
VALUES
    ('30000000-0000-0000-0000-000000000001', 'S-1', 'Rajesh Patel', '9876543210', '20000000-0000-0000-0000-000000000001', 'Ravi', 1, 'in_service', 'online', 30, 250, 0, 0, '[{"name": "Haircut & Styling", "duration": 30, "price": 250}]'::jsonb),
    ('30000000-0000-0000-0000-000000000002', 'S-2', 'Suresh Mehta', '9823456789', '20000000-0000-0000-0000-000000000002', 'Amit', 2, 'called', 'online', 45, 400, 1, 0, '[{"name": "Haircut & Styling", "duration": 30, "price": 250}, {"name": "Beard Grooming & Shape", "duration": 15, "price": 150}]'::jsonb),
    ('30000000-0000-0000-0000-000000000003', 'S-3', 'Jignesh Shah', '9898123456', NULL, 'Any Available Stylist', NULL, 'waiting', 'online', 30, 250, 2, 15, '[{"name": "Haircut & Styling", "duration": 30, "price": 250}]'::jsonb),
    ('30000000-0000-0000-0000-000000000004', 'W-1', 'Harishbhai Walk-in', '9712345678', '20000000-0000-0000-0000-000000000001', 'Ravi', 1, 'waiting', 'walk_in', 20, 150, 3, 35, '[{"name": "Beard Grooming & Shape", "duration": 20, "price": 150}]'::jsonb),
    ('30000000-0000-0000-0000-000000000005', 'S-4', 'Jayesh Dave', '9879012345', NULL, 'Any Available Stylist', NULL, 'waiting', 'online', 55, 650, 4, 45, '[{"name": "Haircut & Styling", "duration": 30, "price": 250}, {"name": "Charcoal Detan Facial", "duration": 25, "price": 400}]'::jsonb)
ON CONFLICT (id) DO NOTHING;
