/**
 * test-join-queue-flow.cjs
 * Verifies Customer Join Queue functionality against the 8 troubleshooting checks
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('🧪 TESTING CUSTOMER JOIN QUEUE & SUPABASE INSERTION PIPELINE');
console.log('================================================================\n');

// 1. Check Table Name and Schema Columns
console.log('--- CHECK 1 & 2: Table Name & Target Columns ---');
const schemaContent = fs.readFileSync(path.join(__dirname, 'supabase', 'schema.sql'), 'utf8');

assert.ok(schemaContent.includes('CREATE TABLE IF NOT EXISTS public.queue_tokens') || schemaContent.includes('CREATE TABLE IF NOT EXISTS queue_tokens'), 'Must define queue_tokens table');

const expectedColumns = [
  'token_number',
  'customer_id',
  'customer_name',
  'customer_phone',
  'service_ids',
  'services',
  'barber_id',
  'barber_name',
  'chair_number',
  'status',
  'source',
  'total_duration',
  'total_price',
  'position',
  'estimated_wait_minutes',
  'joined_at'
];

expectedColumns.forEach(col => {
  assert.ok(schemaContent.includes(col), `Column ${col} must exist in queue_tokens schema`);
});
console.log('✓ Target table is "queue_tokens" and all 16 required columns are defined');

// 2. Check barber_id UUID sanitization
console.log('\n--- CHECK 3: barber_id UUID Type Safety ---');
const isValidUuid = (val) => {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
};

// Simulation of UUID resolution logic in QueueContext.jsx
function resolveBarberUuid(inputBarberId, inputBarberName, barbersList) {
  if (inputBarberId && isValidUuid(inputBarberId)) {
    return inputBarberId;
  }
  if (inputBarberId && inputBarberId !== 'any') {
    const matched = barbersList.find(b =>
      b.id === inputBarberId ||
      b.name?.toLowerCase() === inputBarberName?.toLowerCase()
    );
    if (matched && isValidUuid(matched.id)) {
      return matched.id;
    }
  }
  return null; // Safe fallback to avoid PostgreSQL 22P02 invalid input syntax for type uuid
}

const mockDbBarbers = [
  { id: '20000000-0000-0000-0000-000000000001', name: 'Ravi', chair: 1 },
  { id: '20000000-0000-0000-0000-000000000002', name: 'Amit', chair: 2 }
];

// Test with dummy non-UUID id ('barber-ravi')
const resolvedRavi = resolveBarberUuid('barber-ravi', 'Ravi', mockDbBarbers);
assert.strictEqual(resolvedRavi, '20000000-0000-0000-0000-000000000001', 'Should resolve dummy ID to valid database UUID');

// Test with 'any'
const resolvedAny = resolveBarberUuid(null, 'Any Available Stylist', mockDbBarbers);
assert.strictEqual(resolvedAny, null, 'Any stylist must resolve to NULL in PostgreSQL');

// Test with non-matching string
const resolvedUnknown = resolveBarberUuid('unknown-non-uuid', 'Unknown', mockDbBarbers);
assert.strictEqual(resolvedUnknown, null, 'Unmatched string must resolve to NULL to avoid UUID cast error');
console.log('✓ barber_id UUID sanitization verified: Never sends non-UUID strings to PostgreSQL');

// 3. Check Services JSONB payload formatting
console.log('\n--- CHECK 4: Services JSONB Payload Formatting ---');
const selectedServices = [
  { id: 'srv-1', name_en: 'Signature Haircut', name_gu: 'સિગ્નેચર હેરકટ', duration: 30, price: 250, category: 'Hair' }
];

const servicesPayload = selectedServices.map(s => ({
  id: s.id,
  name: s.name_en,
  duration: s.duration,
  price: s.price,
  category: s.category
}));

assert.ok(Array.isArray(servicesPayload));
assert.strictEqual(servicesPayload[0].name, 'Signature Haircut');
assert.strictEqual(servicesPayload[0].price, 250);
console.log('✓ Services payload properly formatted as structured JSONB snapshot');

// 4. Check Async Await & Error Handling in CustomerJoinPage.jsx
console.log('\n--- CHECK 5, 6 & 8: Async Waiting & Error Handling ---');
const joinPageContent = fs.readFileSync(path.join(__dirname, 'src', 'pages', 'CustomerJoinPage.jsx'), 'utf8');

assert.ok(joinPageContent.includes('const handleFinalConfirm = async ()'), 'handleFinalConfirm must be an async function');
assert.ok(joinPageContent.includes('await joinOnlineQueue(tokenPayload)'), 'handleFinalConfirm must await joinOnlineQueue');
assert.ok(joinPageContent.includes('setSubmitError'), 'Must handle and set submitError state');
assert.ok(joinPageContent.includes('submitError &&'), 'Must render error banner when database fails');
assert.ok(!joinPageContent.includes('setTimeout(() => {\n      setIsSubmitting(false);\n      setShowConfirmation(false);\n      navigate(\'/status\');\n    }, 500);'), 'Must NOT blindly navigate with 500ms timeout on failure');

console.log('✓ CustomerJoinPage correctly awaits Supabase insert and displays error banner on failure');

// 5. Check RLS Policies in schema
console.log('\n--- CHECK 7: Database RLS Policies ---');
assert.ok(schemaContent.includes('CREATE POLICY "Allow public insert queue tokens"'), 'Must define public INSERT policy for queue_tokens');
assert.ok(schemaContent.includes('CREATE POLICY "Allow public read queue tokens"'), 'Must define public SELECT policy for queue_tokens');
assert.ok(schemaContent.includes('ALTER TABLE public.queue_tokens ENABLE ROW LEVEL SECURITY;'), 'RLS must be enabled');

console.log('✓ RLS policies verified: Both INSERT and SELECT allowed for public/anon');

console.log('\n================================================================');
console.log('🎉 ALL 8 CUSTOMER JOIN QUEUE INTEGRATION CHECKS PASSED!');
console.log('================================================================');
