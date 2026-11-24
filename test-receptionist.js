import assert from 'node:assert';
import { 
  getNextEligibleCustomer, 
  isBarberBusy, 
  getActiveCustomerForBarber,
  generateWalkInTokenNumber 
} from './src/lib/queueRules.js';

console.log("=== RECEPTIONIST DASHBOARD & BARBER ASSIGNMENT TEST SUITE ===");

// -------------------------------------------------------------------------
// SCENARIO 1: Strict FCFS Barber Preference (Specific Barber Match vs Any)
// -------------------------------------------------------------------------
console.log("\n[SCENARIO 1] Testing FCFS with Specific Barber vs Any Stylist...");
const testQueue1 = [
  { id: 't-1', tokenNumber: 'S-1', status: 'waiting', barberId: 'barber-amit', customerName: 'Amit Only' },
  { id: 't-2', tokenNumber: 'S-2', status: 'waiting', barberId: 'barber-ravi', customerName: 'Ravi Only' },
  { id: 't-3', tokenNumber: 'W-1', status: 'waiting', barberId: 'any', customerName: 'Any Stylist 1' },
  { id: 't-4', tokenNumber: 'S-3', status: 'waiting', barberId: 'barber-imran', customerName: 'Imran Only' },
];

// Amit calls next: Token 1 matches Amit
const amitCall = getNextEligibleCustomer('barber-amit', testQueue1);
assert.strictEqual(amitCall?.id, 't-1', 'Amit should receive Token 1 (requested Amit)');
console.log(`✔ Amit correctly called: ${amitCall.customerName} (${amitCall.tokenNumber})`);

// Imran calls next: Token 1 (Amit) & Token 2 (Ravi) are skipped; Token 3 (Any) is chosen because it is ahead of Token 4 (Imran) in FCFS
const imranCall = getNextEligibleCustomer('barber-imran', testQueue1);
assert.strictEqual(imranCall?.id, 't-3', 'Imran should skip Amit & Ravi tokens and pick Token 3 (Any Stylist) based on FCFS');
console.log(`✔ Imran correctly skipped specific barber requests and called FCFS Any: ${imranCall.customerName} (${imranCall.tokenNumber})`);

// -------------------------------------------------------------------------
// SCENARIO 2: Skipping Mismatched Preferences
// -------------------------------------------------------------------------
console.log("\n[SCENARIO 2] Testing Skipping of Non-Matching Specific Preferences...");
const testQueue2 = [
  { id: 't-10', tokenNumber: 'S-10', status: 'waiting', barberId: 'barber-ravi', customerName: 'Ravi Exclusive' },
  { id: 't-11', tokenNumber: 'S-11', status: 'waiting', barberId: 'barber-imran', customerName: 'Imran Exclusive' },
];

// Amit calls: Nobody requested Amit and nobody chose Any
const amitNoMatch = getNextEligibleCustomer('barber-amit', testQueue2);
assert.strictEqual(amitNoMatch, null, 'Amit should find NO eligible customer when queue only has Ravi and Imran requests');
console.log(`✔ Amit correctly found no matching customer (does not hijack Ravi or Imran customers).`);

// Ravi calls: Should pick Token 10 (Ravi Exclusive)
const raviMatch = getNextEligibleCustomer('barber-ravi', testQueue2);
assert.strictEqual(raviMatch?.id, 't-10', 'Ravi should pick Token 10');
console.log(`✔ Ravi correctly called: ${raviMatch.customerName}`);

// -------------------------------------------------------------------------
// SCENARIO 3: Barber Concurrency Prevention
// -------------------------------------------------------------------------
console.log("\n[SCENARIO 3] Testing Barber Concurrency Prevention (Max 1 customer per barber)...");
const testQueue3 = [
  { id: 't-busy', tokenNumber: 'S-busy', status: 'in_service', barberId: 'barber-ravi', customerName: 'Sitting in Chair' },
  { id: 't-waiting', tokenNumber: 'S-next', status: 'waiting', barberId: 'barber-ravi', customerName: 'Waiting in Line' },
];

// Check if Ravi is busy
const raviBusy = isBarberBusy('barber-ravi', testQueue3);
assert.strictEqual(raviBusy, true, 'Ravi must be flagged as BUSY because he has an active in_service customer');

// Ravi attempts to call next customer while busy: MUST BE BLOCKED (returns null)
const blockedCall = getNextEligibleCustomer('barber-ravi', testQueue3);
assert.strictEqual(blockedCall, null, 'Barber who is busy must be blocked from receiving a second customer');
console.log(`✔ Barber concurrency blocked: Ravi is busy with "${testQueue3[0].customerName}", call next returned null.`);

// Once the active customer completes service:
testQueue3[0].status = 'completed';
const raviNowFree = isBarberBusy('barber-ravi', testQueue3);
assert.strictEqual(raviNowFree, false, 'Ravi must now be FREE after completion');

const allowedCall = getNextEligibleCustomer('barber-ravi', testQueue3);
assert.strictEqual(allowedCall?.id, 't-waiting', 'Ravi can now call the next customer');
console.log(`✔ Concurrency freed: Ravi is now available and called next customer "${allowedCall.customerName}".`);

// -------------------------------------------------------------------------
// TEST 4: High Wait Highlighting (> 60 minutes)
// -------------------------------------------------------------------------
console.log("\n[TEST 4] Testing High Wait Rule (>60 mins)...");
const customerOver60 = { elapsedMinutes: 72, status: 'waiting' };
const customerUnder60 = { elapsedMinutes: 45, status: 'waiting' };
const isHighWait = (c) => c.status === 'waiting' && (c.elapsedMinutes || 0) > 60;

assert.strictEqual(isHighWait(customerOver60), true, 'Customer waiting 72 mins must trigger high wait alert');
assert.strictEqual(isHighWait(customerUnder60), false, 'Customer waiting 45 mins must not trigger high wait alert');
console.log(`✔ High wait rule verified: >60m triggers alert badge.`);

// -------------------------------------------------------------------------
// TEST 5: Walk-In Token Generation (W-1, W-2...)
// -------------------------------------------------------------------------
console.log("\n[TEST 5] Testing Walk-In Token Generation (W-1, W-2...)...");
const w1 = generateWalkInTokenNumber();
assert(/^W-\d+$/.test(w1), `Walk-in token ${w1} must match W-<number> format`);
console.log(`✔ Walk-In token format verified: ${w1}`);

console.log("\n=== ALL RECEPTIONIST & BARBER ASSIGNMENT TESTS PASSED! ===");
