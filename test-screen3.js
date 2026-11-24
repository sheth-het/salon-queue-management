import assert from 'node:assert';
import { 
  generateNextTokenNumber, 
  calculateDynamicWaitTime, 
  getQueuePosition, 
  evaluateCustomerState 
} from './src/lib/queueRules.js';

console.log("=== SCREEN 3 (MY STATUS) & QUEUE RULES TEST SUITE ===");

// -------------------------------------------------------------
// TEST 1: Token Generation Format (S-1, S-2, S-3...)
// -------------------------------------------------------------
console.log("\n[TEST 1] Verifying Token Generation Format (S-1, S-2, S-3)...");
const t1 = generateNextTokenNumber();
assert(/^S-\d+$/.test(t1), `Token ${t1} must match format S-<number>`);
console.log(`✔ Generated sample token: ${t1}`);

// -------------------------------------------------------------
// TEST 2: Dynamic Wait Time Calculation
// -------------------------------------------------------------
console.log("\n[TEST 2] Testing Dynamic Wait-Time Calculation Formula...");

// Case A: Specific Barber (e.g. Ravi) with 1 preceding customer of 30 mins
const waitSpecific = calculateDynamicWaitTime({
  barberId: 'barber-ravi',
  precedingCustomers: [{ barberId: 'barber-ravi', totalDuration: 30 }],
  activeBarbersCount: 3,
  bufferMinutes: 5,
  currentServiceRemainingMinutes: 10
});
// Expected: 10 (remaining) + 30 (preceding) + 5 (buffer * 1) = 45 mins
assert.strictEqual(waitSpecific, 45, 'Specific barber wait time should match formula');
console.log(`✔ Specific barber wait time calculated correctly: ${waitSpecific} mins`);

// Case B: Any Available Barber with 3 preceding customers (total 60 mins) across 3 barbers
const waitAny = calculateDynamicWaitTime({
  barberId: 'any',
  precedingCustomers: [
    { totalDuration: 20 },
    { totalDuration: 20 },
    { totalDuration: 20 }
  ],
  activeBarbersCount: 3,
  bufferMinutes: 5,
  currentServiceRemainingMinutes: 10
});
// (3 * 10 + 60) / 3 + 5 = 90 / 3 + 5 = 30 + 5 = 35 mins
assert.strictEqual(waitAny, 35, 'Any barber wait time should match distributed formula');
console.log(`✔ Any available barber wait time calculated correctly: ${waitAny} mins`);

// -------------------------------------------------------------
// TEST 3: Queue Position Determination
// -------------------------------------------------------------
console.log("\n[TEST 3] Testing Queue Position Determination...");
const sampleQueue = [
  { id: 'tok-1', status: 'called' },
  { id: 'tok-2', status: 'waiting' },
  { id: 'tok-3', status: 'waiting' }
];

const pos1 = getQueuePosition('tok-1', sampleQueue);
assert.strictEqual(pos1.position, 1, 'First token must be position 1');
assert.strictEqual(pos1.peopleAhead, 0, 'First token has 0 people ahead');

const pos2 = getQueuePosition('tok-2', sampleQueue);
assert.strictEqual(pos2.position, 2, 'Second token must be position 2');
assert.strictEqual(pos2.peopleAhead, 1, 'Second token has 1 person ahead');

const pos3 = getQueuePosition('tok-3', sampleQueue);
assert.strictEqual(pos3.position, 3, 'Third token must be position 3');
assert.strictEqual(pos3.peopleAhead, 2, 'Third token has 2 people ahead');
console.log("✔ Queue positions and people ahead calculated accurately.");

// -------------------------------------------------------------
// TEST 4: "Start coming" State (When customer is 2nd in line)
// -------------------------------------------------------------
console.log("\n[TEST 4] Verifying 'Start coming' state when 2nd in line...");
const tokenWaitingSecond = {
  tokenNumber: 'S-2',
  status: 'waiting',
  customerName: 'Jignesh Shah'
};
const stateSecond = evaluateCustomerState({
  token: tokenWaitingSecond,
  queuePosition: 2
});
assert.strictEqual(stateSecond.code, 'start_coming', "Code must be 'start_coming' when position is 2");
assert.strictEqual(stateSecond.titleEn, 'Start coming');
assert(stateSecond.isAlert, "'Start coming' state must be marked as an alert");
console.log(`✔ 'Start coming' state correctly triggered: "${stateSecond.titleEn}" / "${stateSecond.titleGu}"`);

// -------------------------------------------------------------
// TEST 5: "It's your turn" State (When receptionist calls token)
// -------------------------------------------------------------
console.log("\n[TEST 5] Verifying 'It\\'s your turn' state when called...");
const tokenCalled = {
  tokenNumber: 'S-1',
  status: 'called',
  customerName: 'Aarav Patel',
  chair: 1,
  barberName: 'Ravi'
};
const stateCalled = evaluateCustomerState({
  token: tokenCalled,
  queuePosition: 1
});
assert.strictEqual(stateCalled.code, 'its_your_turn', "Code must be 'its_your_turn' when status is called");
assert.strictEqual(stateCalled.titleEn, "It's your turn!");
assert(stateCalled.shouldChime, "'It\\'s your turn' must trigger audio chime flag");
console.log(`✔ 'It\\'s your turn' state correctly triggered: "${stateCalled.titleEn}" / "${stateCalled.titleGu}"`);

// -------------------------------------------------------------
// TEST 6: Standard Waiting State (Position > 2)
// -------------------------------------------------------------
console.log("\n[TEST 6] Verifying Standard Waiting state (Position > 2)...");
const tokenWaitingThird = {
  tokenNumber: 'S-3',
  status: 'waiting',
  customerName: 'Ketan Trivedi'
};
const stateThird = evaluateCustomerState({
  token: tokenWaitingThird,
  queuePosition: 3
});
assert.strictEqual(stateThird.code, 'waiting', "Code must be 'waiting' when position is 3");
console.log(`✔ Standard waiting state correctly assigned: "${stateThird.titleEn}"`);

console.log("\n=== ALL SCREEN 3 & QUEUE RULES TESTS PASSED! ===");
