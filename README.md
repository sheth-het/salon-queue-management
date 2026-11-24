# 💈 Royal Grooming Lounge — Salon Queue Management System

> A modern, real-time, bilingual salon queue management web application built for single-location premium salons. Seamlessly coordinates customers, receptionists, barbers, and a 16:9 waiting area TV display with live synchronized queue state.

---

## 🚀 Live Production Deployment

🔗 **Live Web Application**: [https://salon-queue-management-nu.vercel.app/](https://salon-queue-management-nu.vercel.app/)

Access the live app from any smartphone, tablet, laptop, or smart TV display.

---

## 📋 System Overview & Multi-Device Roles

The system provides 7 dedicated screen experiences tailored for every stakeholder in the salon:

| Screen | Route | Target Device | Description |
|---|---|---|---|
| **Screen 1: Customer Home** | `/` | Smartphone / Desktop | Salon status banner, live queue counters, current wait time, and primary CTA. |
| **Screen 2: Join Queue** | `/join` | Smartphone | Service selection matrix (up to 3 services), preferred stylist selection, 10-digit mobile validation, and review modal. |
| **Screen 3: Live Token Status** | `/status` | Smartphone | Live queue position, countdown time, dynamic states (*"Waiting in Line"*, *"Start coming"*, *"It's your turn!"*), and cancellation. |
| **Screen 4: Reception Desk** | `/receptionist` | Tablet / Desktop | Front desk control: FCFS waiting queue, walk-in registration, barber assignment, 60+ min wait alerts, and no-show marking. |
| **Screen 5: Barber Station** | `/barber` | Tablet / Mobile | Individual barber station: Active customer details, live styling timer, Call Next, Start Service, Done, and Break controls. |
| **Screen 6: Waiting Area TV** | `/tv` | 16:9 Lounge TV Kiosk | Dedicated passive kiosk view: Big typography "Now Serving" chair tiles with ripple animation, "Up Next" waiting list, audio chime, and news ticker. |
| **Screen 7: Owner Settings** | `/owner` | Desktop / Tablet | Administrative dashboard: Manage services & pricing, toggle service availability, barber roster controls, and daily analytics. |

---

## 🛠️ Technology Stack

- **Frontend**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with a custom Charcoal & Gold luxury palette
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & Realtime**: [Supabase](https://supabase.com/) (PostgreSQL with Realtime WebSocket Broadcasts & Row Level Security)
- **Audio Synthesizer**: Native Web Audio API dual-tone chime (no external audio assets required)
- **Localization**: Lightweight React Context bilingual dictionary (English & Gujarati)
- **Hosting**: [Vercel](https://vercel.com/)

---

## ✨ Key Architectural Features

### 1. Charcoal & Gold Luxury Aesthetics
- Designed specifically for modern salons with dark charcoal backgrounds (`#121212`, `#18181B`, `#222226`) and metallic gold accents (`#D4AF37`, `#E5C158`, `#AA771C`).
- Tested for WCAG AA compliance with high-contrast text and glowing state indicators.

### 2. Bilingual Support (English & Gujarati)
- Instant, zero-latency language switching between **English** and **ગુજરાતી** across all customer and staff screens via `LanguageContext`.

### 3. Dynamic Wait Time Engine (`src/lib/queueRules.js`)
- Computes individualized wait times based on preceding customers, selected service durations, active on-duty barbers, and buffer time between services.
- Strict First-Come, First-Served (FCFS) barber preference matching.

### 4. Zero-Flicker Cross-Window Realtime Synchronization
- Powered by Supabase Realtime PostgreSQL Change Data Capture (`postgres_changes`).
- When a customer joins on their phone, the Receptionist Dashboard and Waiting Area TV instantly reflect the new entry without requiring page reloads.

### 5. Native TV Audio Chime
- Uses the Web Audio API to synthesize a melodic two-tone chime (E5 at 659Hz to A5 at 880Hz) whenever a barber calls a customer.

---

## 🗄️ Database Architecture & PostgreSQL Schema

The database schema is defined in [supabase/schema.sql](supabase/schema.sql) and [supabase/migrations/20261124_init_salon_queue.sql](supabase/migrations/20261124_init_salon_queue.sql):

1. **`salon_settings`**: Global salon state, queue open/closed switch, capacity, and buffer duration.
2. **`services`**: Service catalog (English & Gujarati names, duration in minutes, price in INR, and active status).
3. **`barbers`**: Stylist roster, assigned chair numbers, shift availability (`active`, `break`, `off_duty`).
4. **`customers`**: Customer directory tracking name, phone number, and visit history.
5. **`queue_tokens`**: Core queue entries tracking token number (`S-XXX` for online, `W-XXX` for walk-ins), status lifecycle (`waiting` → `called` → `in_service` → `completed` / `no_show` / `cancelled`), assigned barber, and timestamps.

All dynamic tables have **Row Level Security (RLS)** enabled with public read/write access policies for operational transparency.

---

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js 18+ installed
- npm or pnpm

### 2. Clone Repository
```bash
git clone https://github.com/your-username/salon-queue-management.git
cd salon-queue-management
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://awfssfidsdjskwxbcgup.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_nRPVAlffgxUmVJtX3gFKdw_T_aaGqf1
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_nRPVAlffgxUmVJtX3gFKdw_T_aaGqf1
```

### 5. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 6. Production Build
```bash
npm run build
```

---

## 🧪 Automated Verification & Test Suites

The project includes automated regression test suites covering 21 critical flow cases, Supabase integration, and queue rules:

```bash
# Run comprehensive 21-case functional checklist
node test-complete-checklist.cjs

# Run live Supabase schema, RLS, and multi-browser realtime simulation
node test-supabase-integration.cjs

# Run customer join queue pipeline and UUID safety tests
node test-join-queue-flow.cjs
```

---

## 📄 Complete Prompts History

All engineering prompts provided throughout the project's evolution are documented in [prompt.md](prompt.md).

---

## 📜 Project Documentation

- [docs/01-brief.md](docs/01-brief.md): Project Mission, Constraints & Architecture
- [docs/02-screens.md](docs/02-screens.md): Detailed Specifications for all 7 Screens
- [docs/03-flows-rules.md](docs/03-flows-rules.md): Queue Logic Rules, Status State Machines & Test Checklist
- [AGENTS.md](AGENTS.md): Developer & AI Agent Guidelines
