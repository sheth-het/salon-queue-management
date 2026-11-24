# AGENTS.md: Developer & AI Agent Guidelines

This document serves as the operational guide, engineering blueprint, and strict rules of engagement for any AI agent or software engineer developing the **Salon Queue Management System**.

---

## 1. Project Mission & Technology Stack

The goal is to build a responsive, real-time salon queue management web application for a single-location salon, supporting customers, receptionists, barbers, and a waiting area TV display.

- **Build Tool**: Vite (React 18 / TypeScript or JSX)
- **Styling**: Tailwind CSS with custom Charcoal & Gold color tokens
- **Icons**: Lucide React (`lucide-react`)
- **Backend & Realtime**: Supabase (`@supabase/supabase-js`)
- **Localization**: Lightweight bilingual dictionary (English & Gujarati) via React Context
- **Sound**: Native Web Audio API synthesizer for the TV calling chime (no external audio assets required)

---

## 2. Directory Structure Blueprint

When application code is approved to be created, structure the repository as follows:

```
Salon_Queue/
├── docs/
│   ├── 01-brief.md
│   ├── 02-screens.md
│   └── 03-flows-rules.md
├── AGENTS.md
├── public/
│   ├── favicon.ico
│   └── salon-logo.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.jsx
│   │   │   ├── LanguageSwitcher.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── Modal.jsx
│   │   ├── customer/
│   │   │   ├── QueueJoinForm.jsx
│   │   │   └── TokenStatusCard.jsx
│   │   ├── receptionist/
│   │   │   ├── WalkInModal.jsx
│   │   │   └── QueueTable.jsx
│   │   ├── barber/
│   │   │   ├── ActiveCustomerCard.jsx
│   │   │   └── BarberQueueList.jsx
│   │   ├── tv/
│   │   │   ├── NowServingGrid.jsx
│   │   │   ├── UpNextList.jsx
│   │   │   └── TickerBanner.jsx
│   │   └── owner/
│   │       ├── ServiceManager.jsx
│   │       ├── BarberManager.jsx
│   │       └── QueueControlTab.jsx
│   ├── contexts/
│   │   ├── LanguageContext.jsx    # EN / GU toggle and translations
│   │   └── QueueContext.jsx       # Supabase Realtime subscription & state
│   ├── lib/
│   │   ├── supabase.js            # Supabase client singleton
│   │   ├── sound.js               # Web Audio API chime generator
│   │   └── waitTime.js            # Dynamic wait time computation formula
│   ├── locales/
│   │   ├── en.json                # English dictionary
│   │   └── gu.json                # Gujarati (ગુજરાતી) dictionary
│   ├── pages/
│   │   ├── CustomerPage.jsx       # Phone queue join & live status
│   │   ├── ReceptionistPage.jsx   # Front-desk tablet/desktop view
│   │   ├── BarberPage.jsx         # Station view for individual barbers
│   │   ├── TVDisplayPage.jsx      # Waiting area 16:9 fullscreen display
│   │   └── OwnerPage.jsx          # Settings & service management
│   ├── App.jsx                    # Routing / View switcher
│   ├── index.css                  # Tailwind styles and theme definitions
│   └── main.jsx                   # React root entry
├── supabase/
│   └── schema.sql                 # Database DDL & Seed data
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 3. Design System & Theme Rules

All UI components MUST adhere to the **Charcoal & Gold** aesthetic. Never introduce random colors or bright standard blue/purple palettes.

### 3.1 Tailwind Color Palette
Configure `tailwind.config.js` with:
- **Charcoal Dark (Background)**:
  - `charcoal-900`: `#121212` (Base page background)
  - `charcoal-800`: `#18181B` (Secondary surface background)
  - `charcoal-700`: `#222226` (Card and modal containers)
  - `charcoal-600`: `#2D2D32` (Borders and divider lines)
- **Gold Accent (Brand & Highlights)**:
  - `gold-500`: `#D4AF37` (Primary button, active tab, gold leaf text)
  - `gold-400`: `#E5C158` (Hover states)
  - `gold-300`: `#F3E5AB` (Light highlights & text accents)
  - `gold-600`: `#AA771C` (Pressed states & dark gold borders)
- **Status Accents**:
  - Waiting / Pending: Amber (`#F59E0B`)
  - In-Service / Active: Emerald (`#10B981`)
  - No-Show / Cancelled: Crimson (`#EF4444`)
  - Completed: Slate (`#64748B`)

---

## 4. Supabase Database Schema & Realtime Setup

### 4.1 SQL Schema Specification (`supabase/schema.sql`)
```sql
-- 1. Salon Settings Table
CREATE TABLE IF NOT EXISTS salon_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_name TEXT NOT NULL DEFAULT 'Royal Grooming Lounge',
    is_queue_open BOOLEAN NOT NULL DEFAULT true,
    max_queue_capacity INT NOT NULL DEFAULT 25,
    buffer_minutes INT NOT NULL DEFAULT 5,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Services Table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_gu TEXT NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    price INT NOT NULL DEFAULT 200,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Barbers Table
CREATE TABLE IF NOT EXISTS barbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    chair_number INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'break', 'off_duty')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Queue Tokens Table
CREATE TABLE IF NOT EXISTS queue_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    service_ids UUID[] NOT NULL DEFAULT '{}',
    barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'in_service', 'completed', 'no_show', 'cancelled')),
    source TEXT NOT NULL DEFAULT 'online' CHECK (source IN ('online', 'walk_in')),
    total_duration INT NOT NULL DEFAULT 30,
    total_price INT NOT NULL DEFAULT 200,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    called_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Supabase Realtime for queue_tokens and salon_settings
ALTER PUBLICATION supabase_realtime ADD TABLE queue_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE salon_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE barbers;
```

---

## 5. Strict Engineering Constraints & Non-Goals

Agents modifying or expanding the codebase MUST enforce these boundaries:
1. **NO Online Payments**: Do NOT integrate Stripe, Razorpay, or credit card handling. All payments are settled in person at the salon counter.
2. **NO Future Date Booking / Calendar**: The app is strictly for real-time, same-day walk-in and immediate queue joining.
3. **NO SMS / WhatsApp Integrations**: Avoid Twilio or WhatsApp Business API dependencies. The customer tracks their live token directly via the web app.
4. **NO Customer Loyalty / Points System**: Do not add reward points, punch cards, or loyalty tiers.
5. **NO Multi-Branch Management**: The system is designed for a single salon premises. Keep settings and state localized.

---

## 6. Code Style & Quality Checklist for Agents

- **Clean React State**: Encapsulate Supabase subscriptions inside `QueueContext` to avoid multiple redundant WebSocket channels.
- **Fail Gracefully**: If Supabase credentials are missing or invalid, render a mock-mode or clear configuration screen rather than a blank white crash screen.
- **Bilingual Fidelity**: Every customer-facing and receptionist-facing label must utilize the translation key from `LanguageContext` (never hardcode plain English strings without a Gujarati fallback).
- **Responsive Integrity**: Verify that the TV display renders full screen without scrollbars, while customer screens are touch-optimized for mobile viewports.
