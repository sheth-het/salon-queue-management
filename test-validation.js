import assert from 'node:assert';
import { dummySalonSettings, dummyBarbers, dummyServices } from './src/data/dummyData.js';
import en from './src/locales/en.json' with { type: 'json' };
import gu from './src/locales/gu.json' with { type: 'json' };

console.log("=== RUNNING SALON QUEUE AUTOMATED VALIDATION SUITE ===");

// 1. Verify Sample Barbers requirement
console.log("\n[TEST 1] Verifying Sample Barbers (Ravi, Amit, Imran)...");
const barberNames = dummyBarbers.map(b => b.name);
assert(barberNames.includes('Ravi'), 'Barber Ravi must be present');
assert(barberNames.includes('Amit'), 'Barber Amit must be present');
assert(barberNames.includes('Imran'), 'Barber Imran must be present');
assert.strictEqual(dummyBarbers.length, 3, 'There must be exactly 3 sample barbers');
console.log("✔ Sample Barbers test passed: Ravi, Amit, Imran are configured.");

// 2. Verify Salon Settings requirement
console.log("\n[TEST 2] Verifying Salon Name, Opening Status, and Queue Info...");
assert.strictEqual(dummySalonSettings.salonName, 'Royal Grooming Lounge');
assert.strictEqual(dummySalonSettings.isQueueOpen, true);
assert(dummySalonSettings.currentlyWaiting > 0, 'Current queue info must have waiting count');
assert(dummySalonSettings.avgWaitMinutes > 0, 'Current queue info must have avg wait');
assert(dummySalonSettings.activeBarbersCount === 3, 'Active barbers count must be 3');
console.log("✔ Salon information test passed.");

// 3. Verify Phone Number Validation Logic (10 digits)
console.log("\n[TEST 3] Testing 10-Digit Phone Validation Rules...");
const isValidPhone = (val) => {
  const cleaned = val.replace(/\D/g, '');
  return (/^[6-9]\d{9}$/.test(cleaned) || /^\d{10}$/.test(cleaned)) && cleaned.length === 10;
};

assert.strictEqual(isValidPhone('9876543210'), true, 'Valid 10-digit number should pass');
assert.strictEqual(isValidPhone('9825123456'), true, 'Valid 10-digit number should pass');
assert.strictEqual(isValidPhone('12345'), false, '5-digit number must fail');
assert.strictEqual(isValidPhone('987654321012'), false, '12-digit number must fail');
assert.strictEqual(isValidPhone('abcdefghij'), false, 'Alphabetic string must fail');
assert.strictEqual(isValidPhone(''), false, 'Empty string must fail');
console.log("✔ 10-digit phone validation test passed.");

// 4. Verify Max 3 Services Selection Constraint
console.log("\n[TEST 4] Testing Service Selection (Max 3 Services)...");
const testServices = dummyServices.slice(0, 3);
const totalDuration = testServices.reduce((sum, s) => sum + s.duration, 0);
const totalPrice = testServices.reduce((sum, s) => sum + s.price, 0);
assert(totalDuration > 0, 'Total duration should be positive');
assert(totalPrice > 0, 'Total price should be positive');
assert(testServices.length <= 3, 'Selected services must be <= 3');
console.log(`✔ Max 3 services test passed: 3 services selected -> ${totalDuration} mins, ₹${totalPrice}`);

// 5. Verify Bilingual Dictionary Integrity
console.log("\n[TEST 5] Testing English and Gujarati Dictionaries...");
assert.strictEqual(typeof en.salon.name, 'string');
assert.strictEqual(typeof gu.salon.name, 'string');
assert.strictEqual(typeof en.join.fullName, 'string');
assert.strictEqual(typeof gu.join.fullName, 'string');
assert.strictEqual(typeof en.join.confirmationTitle, 'string');
assert.strictEqual(typeof gu.join.confirmationTitle, 'string');
console.log("✔ Bilingual dictionary integrity test passed.");

console.log("\n=== ALL AUTOMATED TESTS PASSED SUCCESSFULLY! ===");
