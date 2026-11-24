# 01 - Project Brief: Salon Queue Management System

## 1. Project Overview
The **Salon Queue Management System** is a real-time, bilingual web application designed for single-location barber shops and hair salons. It modernizes the traditional walk-in experience by eliminating crowded waiting rooms, providing transparent wait times, and synchronizing actions across customer phones, receptionist front desks, barber chairs, and a waiting-area TV display.

This project is tailored as a practical, high-impact college project showcasing modern full-stack web architecture, reactive real-time database state synchronization, and accessible bilingual UI design.

---

## 2. Core Problem & Solution
- **The Problem**: Traditional salons suffer from chaotic paper or verbal queues, inaccurate waiting estimations, customer frustration, unattended no-shows, and lack of visibility for waiting patrons.
- **The Solution**: A multi-role, responsive web app backed by Supabase Realtime that provides:
  - Instant mobile token issuance.
  - Transparent dynamic wait-time estimation based on active barbers and selected services.
  - Front-desk receptionist controls for manual entries and queue coordination.
  - Barber chair controls for calling and serving patrons.
  - A dedicated big-screen TV board displaying token numbers.
  - Owner configurations for services, pricing, barbers, and queue availability.

---

## 3. User Personas & Roles

| Role | Device / Form Factor | Primary Goal |
| :--- | :--- | :--- |
| **Customer** | Mobile smartphone | View live queue status, join the queue, select services, track token status and estimated wait time. |
| **Receptionist** | Tablet or Desktop PC | Register walk-in customers, assign specific barbers, adjust priority, call/cancel tokens, manage no-shows. |
| **Barber / Stylist** | Mobile or Tablet at station | View assigned queue, call next customer to chair, mark service in-progress, complete service. |
| **TV Display** | Large screen / Wall-mounted TV | Continuous auto-updating display showing "Now Serving" per barber, "Up Next" tokens, and announcements. |
| **Salon Owner** | Desktop or Tablet | Manage master list of services (name, duration, price), barber roster, open/close queue status. |

---

## 4. Key Functional Features

### 4.1 Mobile Queue Joining (Customer)
- Scan QR code or visit direct URL.
- Enter customer name and phone number (for identity only).
- Select one or more services (e.g., Haircut, Beard Trim, Hair Color, Facial).
- Choose preferred barber (or choose "Any Available").
- Receive a unique digital Token Number (e.g., `A-101`, `B-102`).
- Track live status: Position in queue, active barber, and dynamic countdown of estimated minutes.

### 4.2 Receptionist Dashboard
- Quick walk-in entry form for clients arriving without smartphones.
- Complete live queue roster with status badges (`Waiting`, `In-Service`, `Completed`, `Cancelled`, `No-Show`).
- Queue reordering, manual status override, and manual token cancellation.
- Real-time notification sound/banner when new tokens are booked.

### 4.3 Barber Station Dashboard
- Individual barber view showing their specific queue and general queue.
- One-click "Call Next Customer" button (triggers TV audio chime/visual cue).
- "Start Service" and "Complete Service" status transitions.
- Quick timer showing service duration.

### 4.4 Waiting Area TV Display
- High-contrast, minimalist kiosk view optimized for 1080p / 4K displays.
- Split-screen layout:
  - Left / Main: "Now Serving" tiles for each active barber with customer token and chair number.
  - Right / Sidebar: Upcoming queue tokens ("Up Next") with estimated wait minutes.
- Visual pulse and audio chime when a token is called.
- Salon status header (Open / Closed / Peak wait notice).

### 4.5 Owner / Admin Settings
- Toggle queue status: **Open** (accepting new joins) vs **Closed** (queue paused / day ended).
- Service Master: Add/edit services, service time estimates (e.g., 20 mins, 45 mins), and prices (₹).
- Barber Master: Add/edit barber profiles, active shift toggle (Active / On Break / Off Duty).
- Basic daily analytics overview: Total customers served, average wait time, total revenue estimate.

### 4.6 Bilingual Localization
- Instant language switcher in the header across all screens:
  - **English (EN)**
  - **Gujarati (GU - ગુજરાતી)**
- Full localization of labels, service titles, statuses, instructions, and error messages.

---

## 5. Design System & Theming

### 5.1 Palette: Charcoal & Gold
The salon aesthetic represents premium grooming and sophisticated hospitality.

- **Primary Background (Charcoal Dark)**: `#121212` / `#18181B` (Zinc-900)
- **Card & Surface Background**: `#1F1F23` / `#27272A` (Zinc-800)
- **Primary Accent (Warm Luxury Gold)**: `#D4AF37` / `#E5C158` (Gold-500)
- **Accent Hover / Active**: `#F3E5AB` (Light Gold) / `#AA771C` (Deep Gold)
- **Text & Foreground**:
  - Primary: `#F9FAFB` (White-zinc)
  - Secondary / Muted: `#9CA3AF` (Muted gray)
- **Status Colors**:
  - Waiting / In-Queue: Amber Gold (`#F59E0B`)
  - In-Service / Serving: Emerald Green (`#10B981`)
  - Completed: Slate Gray (`#64748B`)
  - Cancelled / No-Show: Crimson Red (`#EF4444`)

### 5.2 Typography & Accessibility
- Clean sans-serif font family (`Inter` or system-ui) paired with Gujarati script support (`Noto Sans Gujarati`).
- Minimum 16px touch targets on mobile for quick tap navigation.
- Large, bold numerical typography for tokens on the TV Display (legible from 15+ feet away).

---

## 6. Technical Stack & Architecture

```
+--------------------------------------------------------------------------+
|                               Client Layer                               |
|   +------------------+  +-------------------+  +---------------------+   |
|   |  Customer PWA /  |  |   Staff / Owner   |  |   Waiting Room TV   |   |
|   |   Mobile View    |  |     Dashboards    |  |       Display       |   |
|   +------------------+  +-------------------+  +---------------------+   |
|            |                      |                       |              |
|            +----------------------+-----------------------+              |
|                                   |                                      |
|                       React 18 + Vite + Tailwind CSS                     |
|                   (Bilingual i18n: English / Gujarati)                   |
+-----------------------------------|--------------------------------------+
                                    |
                    Supabase Client (JS SDK v2)
                                    |
+-----------------------------------|--------------------------------------+
|                           Supabase Cloud / BaaS                          |
|   +------------------------------------------------------------------+   |
|   |                     PostgreSQL Database                          |   |
|   |   - salons, barbers, services, queue_tokens, queue_settings      |   |
|   +------------------------------------------------------------------+   |
|   |                    Supabase Realtime Engine                      |   |
|   |   - Broadcast changes via postgres_changes on queue_tokens       |   |
|   |   - Instant live updates on TV and Staff screens                 |   |
|   +------------------------------------------------------------------+   |
|   |               Row Level Security (RLS) & Auth                    |   |
|   |   - Public anonymous read/join for customers                     |   |
|   |   - Role-guarded controls for staff/owner                        |   |
|   +------------------------------------------------------------------+   |
+--------------------------------------------------------------------------+
```

- **Frontend**: React (Vite bundler), Tailwind CSS for styling, Lucide React icons, Web Audio API for TV chimes.
- **Backend / Database**: Supabase PostgreSQL.
- **Realtime Layer**: Supabase Realtime channels listening to `INSERT`, `UPDATE`, and `DELETE` on the `queue_tokens` table.
- **State & Storage**: React Context / Hooks + LocalStorage for remembering customer active token ID and language preference.

---

## 7. Explicit Exclusions (Out of Scope)
To ensure high quality, focus, and feasibility for this college project, the following are strictly excluded:
1. **No Online Payments / Gateways**: All payments are settled in person (cash/UPI) at the counter.
2. **No Future Date Appointments**: System is purely a real-time, same-day walk-in queue.
3. **No Paid SMS / WhatsApp APIs**: Token tracking is performed directly on the open mobile web link.
4. **No Customer Loyalty / Rewards Programs**: Excluded to avoid bloat and complex membership logic.
5. **No Multi-Branch / Multi-Tenant Systems**: Designed specifically for a single salon premises.
