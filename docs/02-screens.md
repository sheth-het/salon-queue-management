# 02 - Screen Specifications: Salon Queue Management System

This document outlines the detailed user interface specifications, responsive layouts, components, interactive buttons, states, and bilingual strings (English and Gujarati) for every screen in the system.

---

## Screen Directory

1. [Screen 1: Customer Queue Join Screen (Mobile-First)](#screen-1-customer-queue-join-screen)
2. [Screen 2: Customer Live Token Status Screen (Mobile-First)](#screen-2-customer-live-token-status-screen)
3. [Screen 3: Receptionist Queue Management Dashboard](#screen-3-receptionist-queue-management-dashboard)
4. [Screen 4: Barber Station Dashboard](#screen-4-barber-station-dashboard)
5. [Screen 5: Waiting Area TV Display (Kiosk View)](#screen-5-waiting-area-tv-display)
6. [Screen 6: Owner Settings & Analytics Dashboard](#screen-6-owner-settings--analytics-dashboard)

---

## Screen 1: Customer Queue Join Screen

### 1.1 Purpose
Allows clients to view salon availability, select their desired services, choose a barber, and join the live queue directly from their mobile smartphone (via QR code scan or link).

### 1.2 Layout & Key Components
- **Header Bar**:
  - Salon Logo & Name ("Royal Grooming Lounge").
  - Language Toggle Pill: `[EN | GU]`.
  - Queue Status Badge: `Open / ખુલ્લું` (Green) or `Closed / બંધ` (Red).
- **Banner / Announcement Area**:
  - Displays current estimated general wait time (e.g., "Current Avg Wait: ~25 mins").
- **Queue Join Form**:
  - **Full Name Input**: Text field with placeholder ("e.g., Aarav Patel").
  - **Mobile Number Input**: 10-digit number field with "+91" prefix.
  - **Service Selection Matrix (Multi-select)**:
    - Interactive cards displaying service icon, bilingual title, duration, and price.
    - Examples:
      - Haircut / હેરકટ (30 mins - ₹200)
      - Beard Grooming / દાઢી ગ્રુમિંગ (20 mins - ₹150)
      - Hair Color / વાળનો કલર (45 mins - ₹500)
      - Face D-Tan / ફેસ ડી-ટેન (30 mins - ₹350)
  - **Preferred Barber Selector (Single-select)**:
    - Option: "Any Available Stylist / કોઈપણ ઉપલબ્ધ વાળંદ" (Default & recommended for faster service).
    - Or list of active barbers with chair numbers.
  - **Live Summary Card**:
    - Total Services Selected: `2 items`
    - Total Estimated Time: `~50 mins`
    - Estimated Total Cost: `₹350`
- **Action Buttons**:
  - `[Join Queue / કતારમાં જોડાઓ]` (Primary CTA, Gold solid button with charcoal text).
  - `[Reset Form / રીસેટ કરો]` (Secondary Ghost button).

### 1.3 State Handling
- **Queue Closed State**: The form inputs and join button are disabled; an amber banner reads: *"The queue is currently closed. Please check back later or visit the counter."*
- **Form Validation State**: Inline error messages if the name is under 2 characters or the phone number is invalid.
- **Submitting State**: Spinner on button with text *"Generating Token... / ટોકન જનરેટ થઈ રહ્યું છે..."*.

---

## Screen 2: Customer Live Token Status Screen

### 1.1 Purpose
Provides real-time feedback to a customer who has joined the queue. Displays their current position, time countdown, and calls to action. Saved to `localStorage` so refreshing does not lose the token.

### 2.2 Layout & Key Components
- **Top Header**:
  - Salon Name & Language Switcher.
  - Live Connection Status Dot (Green = Real-time connected, Amber = Reconnecting).
- **Hero Token Card (Charcoal with Gold Border)**:
  - Token Identifier: Massive display (e.g., `#A-104`).
  - Status Badge:
    - `Waiting / રાહ જોઈ રહ્યા છો` (Amber pulse)
    - `Please Proceed to Chair / ખુરશી પર આવો` (Flashing Gold/Green alert)
    - `In Service / સેવા ચાલુ છે` (Emerald Green)
    - `Completed / સેવા પૂર્ણ થઈ` (Slate Gray)
- **Live Queue Position Metrics**:
  - **Estimated Wait Time**: `~20 mins remaining` (Dynamically recalculated).
  - **People Ahead of You**: `2 Customers Ahead`.
  - **Assigned Barber**: "Ramesh Kumar (Chair #2)" or "Pending Assignment".
- **Selected Services Summary**:
  - Collapsible list showing selected services and individual durations.
- **Safety Instructions / Salon Etiquette Note**:
  - "Please arrive at the waiting area when you have 1 person ahead."
- **Action Buttons**:
  - `[Refresh Status / રિફ્રેશ કરો]` (Manual re-sync).
  - `[Leave Queue / કતાર છોડો]` (Red outline button, triggers confirmation dialog).
  - `[Book Another / નવો ટોકન]` (Only visible when status is `Completed` or `Cancelled`).

### 2.3 Audio & Visual Prompts
- When status changes from `Waiting` to `Called`, the phone screen flashes an alert modal with an audible gentle bell (if allowed by mobile browser) and vibrates.

---

## Screen 3: Receptionist Queue Management Dashboard

### 3.1 Purpose
The central operational screen used by the front-desk receptionist or salon manager on desktop or tablet to manage walk-ins, view the complete queue, handle special requests, and control flow.

### 3.2 Layout & Key Components
- **Top Navigation Bar**:
  - System Title: "Receptionist Command Center".
  - Quick Stats Pills:
    - Active Queue: `8 Waiting`
    - Currently Serving: `3 in Chairs`
    - Average Wait Today: `22 mins`
  - Language Switcher & Fullscreen Button.
  - `[+ New Walk-in Customer / + નવો વૉક-ઇન]` (Quick action button).
- **Quick Walk-in Modal / Drawer**:
  - Fast-entry fields: Name, Phone (Optional for quick walk-ins), Services checklist, Assigned Barber dropdown.
  - Button: `[Generate Walk-in Token / ટોકન આપો]` (Immediately prints/shows token number).
- **Queue Control Filters & Tabs**:
  - Filter Tabs: `All (11)`, `Waiting (8)`, `In Service (3)`, `Completed (24)`, `Cancelled (2)`.
  - Search bar: Filter by Token # or Customer Name.
- **Main Queue Table / List**:
  - Columns:
    1. **Token #**: `#A-101`, `#B-102`
    2. **Customer Name & Phone**: "Jignesh Shah (98980*****)", Walk-in / Online badge
    3. **Services**: Badges (e.g., `Haircut`, `Shave`)
    4. **Barber**: Dropdown selector to manually reassign barber
    5. **Wait Time**: Elapsed wait counter (e.g., `18 mins`)
    6. **Status**: Interactive dropdown or status badge
    7. **Row Actions**:
       - `[Call / બોલાવો]` (Triggers TV flash)
       - `[Start Service / શરૂ કરો]`
       - `[Complete / પૂર્ણ]`
       - `[No Show / ગેરહાજર]`
       - `[Cancel / રદ કરો]`
- **Footer Toolbar**:
  - `[Pause Queue / કતાર થોભાવો]` (Prevents new online joins).
  - `[Reset Day's Queue / દિવસ રીસેટ કરો]` (Requires passcode confirmation).

---

## Screen 4: Barber Station Dashboard

### 4.1 Purpose
A simplified, touch-friendly station view for each individual barber operating at their chair on a mounted tablet or mobile phone.

### 4.2 Layout & Key Components
- **Barber Profile Header**:
  - Barber Selector / Name: "Mahesh - Chair #3".
  - Status Toggle Pill: `[Active / કાર્યરત]` (Green), `[On Break / વિરામ પર]` (Yellow), `[Off Duty / રજા પર]` (Red).
  - Language Switcher: `[EN | GU]`.
- **Card 1: Current Active Customer ("In My Chair")**:
  - Large display of current customer name & token: `#A-102 - Rahul Dave`.
  - Services: `Haircut + Beard Trim` (Total: 45 mins).
  - Elapsed Timer: Live counter showing `12:45 mins`.
  - Action Buttons:
    - `[Complete Service / સેવા પૂર્ણ થઈ]` (Prominent Green button).
    - `[Client No-Show / ગ્રાહક હાજર નથી]` (Subtle warning button).
- **Card 2: Next in My Queue ("Up Next for Chair #3")**:
  - Next assigned customer card with token # and waiting duration.
  - Action Button:
    - `[Call Next Customer / આગળના ગ્રાહકને બોલાવો]` (Gold button; triggers TV notification).
    - `[Start Service / સેવા શરૂ કરો]` (Moves customer into chair).
- **Card 3: Unassigned General Queue Pool**:
  - List of waiting customers who selected "Any Available Stylist".
  - Button: `[Claim Customer / મારા માટે લો]` (Assigns customer directly to this barber).

---

## Screen 5: Waiting Area TV Display

### 5.1 Purpose
A dedicated, passive 16:9 full-screen kiosk interface for wall-mounted TV screens in the customer lounge. High contrast, large typography, readable from across the room.

### 5.2 Layout & Key Components
- **Header Section (Height: ~12% screen)**:
  - Left: Salon Brand Logo & Name in Gold leaf typography.
  - Center: Bilingual News Ticker ("Welcome to Royal Grooming. Please proceed when your token is called / આપનું સ્વાગત છે. તમારો ટોકન બોલાવાય ત્યારે પધારો.").
  - Right: Digital Clock & Date (`11:20 AM | 24 Nov 2026`).
- **Main Split Body (Height: ~88% screen)**:
  - **Left 65% Panel: "NOW SERVING / અત્યારે સેવા ચાલુ છે"**:
    - Grid of active barber station tiles (2 to 4 chairs displayed):
      - Chair Tile:
        - Chair Label: "Chair 1 - Suresh"
        - Serving Token: **A-101** (Huge 72pt+ Gold font)
        - Customer Name: "Vikram S."
        - Status Pill: `SERVING` (Solid Green) or `CALLING NOW` (Blinking Gold with glow effect).
  - **Right 35% Panel: "UP NEXT / પછીનો વારો"**:
    - Dark charcoal container with gold border accents.
    - Scrollable/paged table of the next 5-8 waiting tokens:
      - Token Number (e.g., `#A-105`)
      - Preferred Barber (or "Any")
      - Est. Wait (`~10 min`)
- **Visual & Audio Alert System**:
  - When a barber clicks "Call Customer", the TV plays a crisp 2-tone melodic chime.
  - The corresponding Chair tile pulses with a gold ripple animation for 15 seconds.

---

## Screen 6: Owner Settings & Analytics Dashboard

### 6.1 Purpose
Administrative control panel for the salon owner to manage the service menu, prices, staff members, and daily operational metrics.

### 6.2 Layout & Key Components
- **Header**:
  - Title: "Owner Administration & Settings".
  - Quick Toggle: Master Salon Queue Switch (`Queue OPEN` / `Queue CLOSED`).
- **Tab 1: Service Catalog & Pricing**:
  - Table of configured services:
    - Service Name (English & Gujarati)
    - Default Duration (minutes)
    - Price (₹ INR)
    - Active Toggle (Enabled / Disabled)
    - Edit / Delete buttons
  - `[+ Add New Service / + નવી સેવા ઉમેરો]` Modal:
    - English Title, Gujarati Title, Duration slider (10 to 120 mins), Price input.
- **Tab 2: Barber Roster & Chairs**:
  - Table of barbers:
    - Barber Name
    - Assigned Chair Number
    - Active Status (Working / On Leave)
    - Actions (Edit / Remove)
  - `[+ Add Barber / + નવો વાળંદ ઉમેરો]` Modal.
- **Tab 3: Queue Rules & Configurations**:
  - Buffer time between services (e.g., 5 mins).
  - Maximum queue capacity limit (e.g., max 25 waiting tokens).
  - Allow online queue joins (Yes / No).
- **Tab 4: Daily Performance Summary**:
  - Total tokens served today.
  - Average customer waiting time.
  - Total estimated revenue generated.
  - Barber productivity breakdown (e.g., Ramesh: 8 clients, Suresh: 6 clients).
