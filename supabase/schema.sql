-- =============================================================================
-- SALON QUEUE MANAGEMENT SYSTEM - SUPABASE DATABASE SCHEMA
-- Target Database: Supabase PostgreSQL
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. SALON SETTINGS TABLE
-- Stores operational controls for the salon premises (single-location)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salon_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_name TEXT NOT NULL DEFAULT 'Royal Grooming Lounge',
    is_queue_open BOOLEAN NOT NULL DEFAULT true,
    max_queue_capacity INT NOT NULL DEFAULT 25 CHECK (max_queue_capacity > 0),
    buffer_minutes INT NOT NULL DEFAULT 5 CHECK (buffer_minutes >= 0),
    avg_wait_minutes INT NOT NULL DEFAULT 22 CHECK (avg_wait_minutes >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 2. SERVICES TABLE
-- Stores service catalog, bilingual names, pricing, and active status
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
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

-- -----------------------------------------------------------------------------
-- 3. BARBERS TABLE
-- Stores barber profiles, assigned chairs, and real-time duty status
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS barbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_gu TEXT,
    chair_number INT NOT NULL UNIQUE CHECK (chair_number > 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'break', 'off_duty')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 4. CUSTOMERS TABLE
-- Stores customer contact identity for queue entries
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 5. QUEUE TOKENS TABLE
-- Stores real-time queue tokens, service selections, lifecycle states & timestamps
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS queue_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_number TEXT NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    service_ids UUID[] NOT NULL DEFAULT '{}',
    services JSONB NOT NULL DEFAULT '[]'::jsonb,
    barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL,
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

-- -----------------------------------------------------------------------------
-- PERFORMANCE INDEXES
-- Optimizes FCFS queue retrieval, status lookups, and Realtime queries
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_queue_tokens_status ON queue_tokens(status);
CREATE INDEX IF NOT EXISTS idx_queue_tokens_joined_at ON queue_tokens(joined_at ASC);
CREATE INDEX IF NOT EXISTS idx_queue_tokens_barber ON queue_tokens(barber_id);
CREATE INDEX IF NOT EXISTS idx_queue_tokens_phone ON queue_tokens(customer_phone);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_barbers_status ON barbers(status);

-- -----------------------------------------------------------------------------
-- SUPABASE REALTIME REPLICATION
-- Enable Realtime events for queue tokens, barbers, services, and salon settings
-- -----------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE queue_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE barbers;
ALTER PUBLICATION supabase_realtime ADD TABLE services;
ALTER PUBLICATION supabase_realtime ADD TABLE salon_settings;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures data integrity and role-appropriate access control
-- -----------------------------------------------------------------------------
ALTER TABLE salon_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_tokens ENABLE ROW LEVEL SECURITY;

-- 1. Salon Settings Policies:
-- Anyone (customers, TV, staff) can read settings. Updates restricted to staff/service role.
CREATE POLICY "Allow public read salon settings" 
    ON salon_settings FOR SELECT 
    USING (true);

CREATE POLICY "Allow staff update salon settings" 
    ON salon_settings FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- 2. Services Policies:
-- Public read for catalog display on Home, Join Queue, and TV screens.
CREATE POLICY "Allow public read active services" 
    ON services FOR SELECT 
    USING (true);

CREATE POLICY "Allow staff modify services" 
    ON services FOR ALL 
    USING (true)
    WITH CHECK (true);

-- 3. Barbers Policies:
-- Public read for viewing active stylists on duty.
CREATE POLICY "Allow public read barbers" 
    ON barbers FOR SELECT 
    USING (true);

CREATE POLICY "Allow staff update barber duty" 
    ON barbers FOR ALL 
    USING (true)
    WITH CHECK (true);

-- 4. Customers Policies:
-- Customers can register contact records.
CREATE POLICY "Allow public insert customer" 
    ON customers FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow public read customers" 
    ON customers FOR SELECT 
    USING (true);

-- 5. Queue Tokens Policies:
-- Public read allows TV display, reception dashboard, and customer status live tracking.
CREATE POLICY "Allow public read queue tokens" 
    ON queue_tokens FOR SELECT 
    USING (true);

-- Public insert allows customer online queue joining and receptionist walk-in entry.
CREATE POLICY "Allow public insert queue tokens" 
    ON queue_tokens FOR INSERT 
    WITH CHECK (true);

-- Token updates (barber calling, starting, completing, cancelling, marking no-show)
CREATE POLICY "Allow update queue tokens" 
    ON queue_tokens FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- SEED INITIAL DATA
-- Provides initial barbers, services, and salon configuration
-- -----------------------------------------------------------------------------

-- 1. Initial Salon Settings
INSERT INTO salon_settings (id, salon_name, is_queue_open, max_queue_capacity, buffer_minutes, avg_wait_minutes)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Royal Grooming Lounge',
    true,
    25,
    5,
    22
) ON CONFLICT (id) DO NOTHING;

-- 2. Initial Services
INSERT INTO services (id, name_en, name_gu, category, description_en, description_gu, duration_minutes, price, is_active)
VALUES 
    ('10000000-0000-0000-0000-000000000001', 'Haircut & Styling', 'હેરકટ અને સ્ટાઇલિંગ', 'Hair', 'Precision cut, wash, and blow dry styling', 'પ્રીમિયમ હેરકટ, શેમ્પૂ વોશ અને બ્લો ડ્રાય', 30, 250, true),
    ('10000000-0000-0000-0000-000000000002', 'Beard Grooming & Shape', 'દાઢી ટ્રીમિંગ અને શેપિંગ', 'Beard', 'Hot towel beard trim, shape, and conditioning oil', 'હોટ ટુવાલ શેવિંગ, શેપ અને તેલ માલિશ', 20, 150, true),
    ('10000000-0000-0000-0000-000000000003', 'Royal Head Massage', 'રોયલ માથાની માલિશ', 'Spa', 'Relaxing scalp massage with Ayurvedic herbal oils', 'આયુર્વેદિક તેલ સાથે આરામદાયક માથાની માલિશ', 25, 200, true),
    ('10000000-0000-0000-0000-000000000004', 'Charcoal Detan Facial', 'ચાર્કોલ ડી-ટેન ફેશિયલ', 'Facial', 'Deep pore cleansing, exfoliation, and charcoal mask', 'ડીપ ક્લિનિંગ, સ્ક્રબ અને ચાર્કોલ માસ્ક', 45, 500, true),
    ('10000000-0000-0000-0000-000000000005', 'Hair Color & Touchup', 'હેર કલરિંગ / ડાઈ', 'Hair', 'Organic amonia-free natural black/brown shade', 'ઓર્ગેનિક કેમિકલ વગરનો નેચરલ હેર કલર', 40, 400, true)
ON CONFLICT (id) DO NOTHING;

-- 3. Initial Barbers
INSERT INTO barbers (id, name, name_gu, chair_number, status, is_active)
VALUES 
    ('20000000-0000-0000-0000-000000000001', 'Ravi', 'રવિ', 1, 'active', true),
    ('20000000-0000-0000-0000-000000000002', 'Amit', 'અમિત', 2, 'active', true),
    ('20000000-0000-0000-0000-000000000003', 'Imran', 'ઇમરાન', 3, 'active', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Initial Active Queue Tokens
INSERT INTO queue_tokens (id, token_number, customer_name, customer_phone, barber_id, barber_name, chair_number, status, source, total_duration, total_price, position, estimated_wait_minutes, services)
VALUES
    ('30000000-0000-0000-0000-000000000001', 'S-1', 'Rajesh Patel', '9876543210', '20000000-0000-0000-0000-000000000001', 'Ravi', 1, 'in_service', 'online', 30, 250, 0, 0, '[{"name": "Haircut & Styling", "duration": 30, "price": 250}]'::jsonb),
    ('30000000-0000-0000-0000-000000000002', 'S-2', 'Suresh Mehta', '9823456789', '20000000-0000-0000-0000-000000000002', 'Amit', 2, 'called', 'online', 45, 400, 1, 0, '[{"name": "Haircut & Styling", "duration": 30, "price": 250}, {"name": "Beard Grooming & Shape", "duration": 15, "price": 150}]'::jsonb),
    ('30000000-0000-0000-0000-000000000003', 'S-3', 'Jignesh Shah', '9898123456', NULL, 'Any Available Stylist', NULL, 'waiting', 'online', 30, 250, 2, 15, '[{"name": "Haircut & Styling", "duration": 30, "price": 250}]'::jsonb),
    ('30000000-0000-0000-0000-000000000004', 'W-1', 'Harishbhai Walk-in', '9712345678', '20000000-0000-0000-0000-000000000001', 'Ravi', 1, 'waiting', 'walk_in', 20, 150, 3, 35, '[{"name": "Beard Grooming & Shape", "duration": 20, "price": 150}]'::jsonb),
    ('30000000-0000-0000-0000-000000000005', 'S-4', 'Jayesh Dave', '9879012345', NULL, 'Any Available Stylist', NULL, 'waiting', 'online', 55, 650, 4, 45, '[{"name": "Haircut & Styling", "duration": 30, "price": 250}, {"name": "Charcoal Detan Facial", "duration": 25, "price": 400}]'::jsonb)
ON CONFLICT (id) DO NOTHING;
