# 03 - Queue Rules, User Flows, Error States & Test Checklist

This document defines the computational logic, token lifecycle rules, detailed user journeys, error handling strategies, and quality assurance checklist for the Salon Queue Management System.

---

## 1. Queue Rules & Business Logic

### 1.1 Token Generation & Numbering Algorithm
- **Daily Sequence**: Token numbers reset daily at midnight (or upon manual owner reset).
- **Prefix Strategy**:
  - `A-XXX` (e.g., `A-101`, `A-102`): Online mobile queue registrations.
  - `W-XXX` (e.g., `W-101`, `W-102`): Walk-in registrations recorded by the receptionist.
- **Uniqueness**: Sequence is strictly monotonic per business day to avoid confusion on the TV board and physical receipts.

### 1.2 Dynamic Wait-Time Calculation Formula
Wait time is calculated dynamically on-the-fly and updated in real-time.

#### Scenario A: Customer Selected a Specific Barber
$$\text{Wait Time} = \text{Remaining Time of Current Service} + \sum (\text{Duration of Waiting Customers assigned to that Barber}) + (\text{Buffer} \times N)$$
- Where:
  - $\text{Remaining Time of Current Service} = \max(0, \text{Expected Duration} - \text{Elapsed Duration})$.
  - $\text{Buffer} = 5 \text{ minutes}$ (standard chair cleanup/sanitization per customer).
  - $N = \text{Count of preceding waiting customers assigned to that barber}$.

#### Scenario B: Customer Selected "Any Available Barber"
$$\text{Wait Time} = \frac{\sum (\text{Remaining Service Time of All Active Barbers}) + \sum (\text{Duration of All Waiting Customers})}{\text{Count of Active Working Barbers}} + \text{Buffer}$$
- If no active barbers are working (all on break or off duty), the system displays: `"Estimated wait unavailable (Barbers on break)"`.

### 1.3 Token Status Lifecycle & State Machine

```
              +-------------------+
              |      WAITING      | <----+ (Re-assigned / Re-queued)
              +-------------------+      |
                        |                |
             [Barber calls token]        |
                        v                |
              +-------------------+      |
              |      CALLED       | -----+
              +-------------------+
             /          |          \
   [Customer arrives]   |       [Customer cancels]
           /            |            \
          v             v             v
+-----------------+ +-----------+ +---------------+
|   IN_SERVICE    | |  NO_SHOW  | |   CANCELLED   |
+-----------------+ +-----------+ +---------------+
          |
   [Service finishes]
          v
+-----------------+
|    COMPLETED    |
+-----------------+
```

#### Status Definitions:
1. `WAITING`: Customer is registered and placed in the queue queue pool.
2. `CALLED`: Barber has called the customer to their station; visual alert pulses on TV; sound chime plays.
3. `IN_SERVICE`: Customer is sitting in the chair and service has commenced.
4. `COMPLETED`: Service is finished; token cleared from active TV screen; recorded in daily history.
5. `NO_SHOW`: Customer failed to report after 2 call attempts or a 5-minute grace period.
6. `CANCELLED`: Cancelled either voluntarily by customer or by receptionist upon request.

### 1.4 Queue Capacity & Operating Window
- **Operating Hours**: The salon owner can toggle `is_queue_open` from the Owner settings.
- **Capacity Threshold**: If the active waiting count exceeds `max_queue_capacity` (default: 20), online joining is automatically locked with the message: *"Queue is full for today / આજની કતાર ભરાઈ ગઈ છે"*.
- **Duplicate Prevention**: A mobile phone number can only have **one** active token (`waiting`, `called`, or `in_service`) at any given time.

---

## 2. User Flows

### Flow 1: Customer Self-Service Online Join
```
1. Customer scans QR code outside or visits salon URL.
2. App detects locale (defaults to English, can switch to Gujarati).
3. If queue is CLOSED or FULL -> display informative notice and disable join.
4. Customer enters Name, 10-digit Phone, checks services (e.g. Haircut + Shave).
5. Customer selects Barber preference ("Any Stylist" or "Specific Barber").
6. App calculates total cost and expected duration.
7. Customer clicks "Join Queue / કતારમાં જોડાઓ".
8. Server creates record in `queue_tokens` table.
9. Token ID saved to customer's browser `localStorage`.
10. Screen navigates to "Live Token Status Screen".
11. Real-time channel keeps wait-time countdown and "People ahead" updated.
```

### Flow 2: Receptionist Walk-in Management
```
1. Customer arrives at salon counter without using a phone.
2. Receptionist clicks "+ New Walk-In" button.
3. Receptionist enters customer name and selects requested services.
4. Receptionist assigns to a specific chair or sets to "Any".
5. Receptionist clicks "Generate Walk-in Token".
6. System assigns a `W-XXX` token and verbally informs the client.
7. Record appears immediately on Receptionist table and TV Display.
```

### Flow 3: Barber Station Service Flow
```
1. Barber is ready at their station and views their Station Dashboard.
2. Barber clicks "Call Next Customer / આગળના ગ્રાહકને બોલાવો".
3. Status changes to `CALLED`. TV display triggers chime and flashing tile.
4. Customer's phone displays flashing "Please proceed to Chair X".
5. Customer sits in chair -> Barber clicks "Start Service / સેવા શરૂ કરો" (`IN_SERVICE`).
6. Service timer starts counting up.
7. Service finishes -> Barber clicks "Complete Service / સેવા પૂર્ણ થઈ" (`COMPLETED`).
8. Chair is marked free; Barber is prompted to call the next customer.
```

### Flow 4: Waiting Room TV Auto-Update Flow
```
1. TV runs unattended in browser kiosk / fullscreen mode (F11).
2. Subscribes to Supabase `postgres_changes` on table `queue_tokens`.
3. When payload has `status: 'CALLED'`:
   - Triggers Web Audio API chime.
   - Highlights the designated chair tile with gold pulse effect for 15s.
4. When payload has `status: 'IN_SERVICE'` or `'COMPLETED'`:
   - Instantly updates "Now Serving" tiles and shifts "Up Next" queue without page reload.
```

---

## 3. Error States & Edge Case Handling

| Edge Case / Error | System Behavior & User Experience | Recovery Action |
| :--- | :--- | :--- |
| **No Internet / Network Disconnect** | Red banner: *"Connection lost. Retrying... / જોડાણ તૂટી ગયું છે."* Real-time listeners pause. | Automatically reconnects Supabase Realtime channel once online; re-syncs state. |
| **Duplicate Mobile Number** | Form blocks submission: *"You already have an active token (#A-102)."* | Provides a direct button: *"View My Active Token"* linking to their current token. |
| **Queue Closed by Owner** | Customer Join form replaced with *"Queue is currently closed"*. Active waiting customers are still served. | Receptionist can still manually add priority walk-ins if permitted. |
| **Customer No-Show** | Barber calls customer. If customer doesn't appear after 5 minutes, Barber clicks "Mark No-Show". | Token status set to `NO_SHOW`. Freed chair calls next person in line. |
| **Barber Goes on Emergency Break** | Barber toggles status to `On Break`. | Any customers specifically assigned to this barber are prompted or receptionist reassigns them to "Any Available". |
| **Browser Refresh by Customer** | Customer refreshes or closes mobile browser tab. | App reads `active_token_id` from `localStorage` and restores the live status screen seamlessly. |
| **Customer Leaves / Cancels Token** | Customer clicks "Leave Queue" -> Confirmation modal appears. | If confirmed, status updates to `CANCELLED`; all subsequent wait times recalculate instantly. |

---

## 4. Comprehensive Test Checklist

### 4.1 Functional Test Cases
- [ ] **TC-01**: Customer can select multiple services and see combined duration & price correctly calculated.
- [ ] **TC-02**: Customer joining queue receives a sequential token number (e.g. `A-101`).
- [ ] **TC-03**: Submitting without a name or valid 10-digit phone number displays validation errors.
- [ ] **TC-04**: Customer can cancel their token with confirmation, freeing their queue slot.
- [ ] **TC-05**: Receptionist can add a walk-in (`W-XXX`) without a phone number.
- [ ] **TC-06**: Receptionist can reassign a customer to another barber chair in real-time.
- [ ] **TC-07**: Barber can toggle status between `Active`, `On Break`, and `Off Duty`.
- [ ] **TC-08**: Barber clicking "Call Next" triggers the `CALLED` state.
- [ ] **TC-09**: Barber clicking "Start Service" switches token to `IN_SERVICE` and starts elapsed timer.
- [ ] **TC-10**: Barber clicking "Complete Service" clears the customer from the chair.
- [ ] **TC-11**: Owner can add, edit, and toggle active status of services.
- [ ] **TC-12**: Owner can toggle Master Queue switch to Closed, disabling new joins.

### 4.2 Multi-Device Real-Time Sync Test Cases
- [ ] **TC-13**: Open Customer on Phone (or simulated mobile browser) and TV Display on Desktop. Joining on Phone immediately appears on TV's "Up Next" list without page refresh.
- [ ] **TC-14**: Barber clicking "Call Customer" triggers audio chime and visual flashing card on the TV screen simultaneously.
- [ ] **TC-15**: Receptionist reordering or cancelling a token reflects instantly across all open screens within < 500ms.

### 4.3 Bilingual & Localization Test Cases
- [ ] **TC-16**: Toggle between English and Gujarati on the Customer screen; all labels, buttons, and service descriptions switch instantly.
- [ ] **TC-17**: Gujarati text displays properly without font clipping or layout breaking on mobile devices.
- [ ] **TC-18**: Token numbers and monetary figures (`₹`) remain legible and consistently formatted in both languages.

### 4.4 TV Display & Responsiveness Test Cases
- [ ] **TC-19**: TV Display renders cleanly at 1080p (1920x1080) and 4K without horizontal or vertical scrollbars.
- [ ] **TC-20**: Mobile customer screens fit standard phone viewports (360px - 430px width) without horizontal overflow.
- [ ] **TC-21**: Charcoal & Gold color palette achieves high contrast (WCAG AA compliant) for readability at a distance.
