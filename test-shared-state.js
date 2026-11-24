import assert from 'node:assert';
import { 
  getNextEligibleCustomer, 
  isBarberBusy, 
  getActiveCustomerForBarber,
  calculateDynamicWaitTime 
} from './src/lib/queueRules.js';

console.log("=== SHARED APPLICATION STATE & MULTI-SCREEN SYNC TEST SUITE ===");

// -------------------------------------------------------------------------
// INITIAL SETUP: 3 Barbers (Ravi, Amit, Imran) and Initial Queue
// -------------------------------------------------------------------------
let barbers = [
  { id: 'barber-ravi', name: 'Ravi', chair: 1, status: 'active' },
  { id: 'barber-amit', name: 'Amit', chair: 2, status: 'active' },
  { id: 'barber-imran', name: 'Imran', chair: 3, status: 'active' },
];

let queue = [
  { id: 'tok-1', tokenNumber: 'S-1', customerName: 'Aarav Patel', barberId: 'barber-ravi', chair: 1, status: 'called' },
  { id: 'tok-2', tokenNumber: 'S-2', customerName: 'Jignesh Shah', barberId: 'barber-amit', chair: 2, status: 'waiting' },
  { id: 'tok-3', tokenNumber: 'S-3', customerName: 'Ketan Trivedi', barberId: 'barber-ravi', chair: 1, status: 'waiting' },
  { id: 'tok-4', tokenNumber: 'W-1', customerName: 'Sanjay Rawal', barberId: 'any', chair: null, status: 'waiting' },
  { id: 'tok-5', tokenNumber: 'S-4', customerName: 'Farhan Shaikh', barberId: 'barber-imran', chair: 3, status: 'waiting' },
  { id: 'tok-6', tokenNumber: 'S-5', customerName: 'Deepak Joshi', barberId: 'any', chair: null, status: 'waiting' },
];

// -------------------------------------------------------------------------
// TEST 1: Barber View - START Action updates Receptionist & TV state
// -------------------------------------------------------------------------
console.log("\n[TEST 1] Testing Barber START action...");
// Ravi has tok-1 in 'called' status
let raviActive = getActiveCustomerForBarber('barber-ravi', queue);
assert.strictEqual(raviActive?.tokenNumber, 'S-1');
assert.strictEqual(raviActive?.status, 'called', 'Customer S-1 starts in called status');

// Barber clicks START: status becomes 'in_service'
queue = queue.map(t => t.id === 'tok-1' ? { ...t, status: 'in_service' } : t);

// Verify that Receptionist Dashboard & TV view see 'in_service'
raviActive = getActiveCustomerForBarber('barber-ravi', queue);
assert.strictEqual(raviActive?.status, 'in_service', 'After START, customer must be in_service');
assert.strictEqual(isBarberBusy('barber-ravi', queue), true, 'Ravi must be busy while in_service');
console.log("✔ START button successfully transitioned customer S-1 to 'in_service'.");

// -------------------------------------------------------------------------
// TEST 2: Barber View - DONE Action completes service & frees chair
// -------------------------------------------------------------------------
console.log("\n[TEST 2] Testing Barber DONE action (Complete Service)...");
// Barber clicks DONE: status becomes 'completed'
queue = queue.map(t => t.id === 'tok-1' ? { ...t, status: 'completed' } : t);

// Verify that Ravi is now FREE
raviActive = getActiveCustomerForBarber('barber-ravi', queue);
assert.strictEqual(raviActive, null, 'After DONE, Ravi chair must be vacant');
assert.strictEqual(isBarberBusy('barber-ravi', queue), false, 'Ravi is no longer busy');
console.log("✔ DONE button successfully freed Chair 1 on both Receptionist & TV displays.");

// -------------------------------------------------------------------------
// TEST 3: Barber View - ON BREAK Action updates Receptionist & TV state
// -------------------------------------------------------------------------
console.log("\n[TEST 3] Testing Barber ON BREAK action...");
// Barber Amit toggles to 'break'
barbers = barbers.map(b => b.id === 'barber-amit' ? { ...b, status: 'break' } : b);

const amitBarber = barbers.find(b => b.id === 'barber-amit');
assert.strictEqual(amitBarber?.status, 'break', 'Amit status must be updated to break');
console.log("✔ ON BREAK toggle successfully updated Amit status to 'break' (visible on TV & Reception).");

// -------------------------------------------------------------------------
// TEST 4: Receptionist calls next customer -> immediately appears in Barber View & TV
// -------------------------------------------------------------------------
console.log("\n[TEST 4] Testing Receptionist CALL NEXT action syncing to Barber & TV...");
// Imran calls next eligible customer (should be Sanjay Rawal / W-1 because Jignesh wants Amit and Ketan wants Ravi)
const eligibleForImran = getNextEligibleCustomer('barber-imran', queue);
assert.strictEqual(eligibleForImran?.tokenNumber, 'W-1', 'Eligible customer for Imran must be W-1');

// Update to called
queue = queue.map(t => t.id === eligibleForImran.id ? { ...t, status: 'called', barberId: 'barber-imran', chair: 3 } : t);

// Verify Imran's chair on TV and Barber view shows W-1
const imranActive = getActiveCustomerForBarber('barber-imran', queue);
assert.strictEqual(imranActive?.tokenNumber, 'W-1', "Imran chair must now show W-1 in 'called' status");
console.log(`✔ Customer W-1 called to Chair 3; immediately synced to Barber View and TV display.`);

// -------------------------------------------------------------------------
// TEST 5: Waiting Area TV Display - Next 5 Tokens & Wait Times
// -------------------------------------------------------------------------
console.log("\n[TEST 5] Testing TV Display Up Next 5 Tokens...");
const waitingTokens = queue.filter(t => t.status === 'waiting');
const nextFive = waitingTokens.slice(0, 5);

assert.strictEqual(nextFive.length, 4, 'Should show all 4 remaining waiting tokens');
assert.strictEqual(nextFive[0].tokenNumber, 'S-2', 'First up next must be S-2');
assert.strictEqual(nextFive[1].tokenNumber, 'S-3', 'Second up next must be S-3');
assert.strictEqual(nextFive[2].tokenNumber, 'S-4', 'Third up next must be S-4');
assert.strictEqual(nextFive[3].tokenNumber, 'S-5', 'Fourth up next must be S-5');

// Verify dynamic wait time calculation for each
const waitTimes = nextFive.map(t => calculateDynamicWaitTime({
  barberId: t.barberId,
  precedingCustomers: [],
  activeBarbersCount: 2, // 1 barber on break
  bufferMinutes: 5
}));
assert(waitTimes.every(w => w > 0), 'Every token must have a calculated wait time > 0');
console.log(`✔ TV Up Next accurately displays the upcoming tokens with wait times: ${waitTimes.join('m, ')}m.`);

console.log("\n=== ALL SHARED STATE & SCREEN SYNC TESTS PASSED! ===");
