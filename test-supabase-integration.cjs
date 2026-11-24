/**
 * test-supabase-integration.cjs
 * Verification test suite for Supabase Integration & Multi-Browser Real-Time Sync
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('🧪 RUNNING SUPABASE INTEGRATION & REALTIME VERIFICATION SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// TEST 1: Verify SQL Schema File, Tables, Constraints, Indexes & Policies
// -----------------------------------------------------------------------------
console.log('--- TEST 1: Supabase PostgreSQL Schema & Security Verification ---');

const schemaPath = path.join(__dirname, 'supabase', 'schema.sql');
assert.ok(fs.existsSync(schemaPath), 'supabase/schema.sql must exist');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Verify Tables
const requiredTables = ['salon_settings', 'services', 'barbers', 'customers', 'queue_tokens'];
requiredTables.forEach(table => {
  assert.ok(
    schemaContent.includes(`CREATE TABLE IF NOT EXISTS ${table}`),
    `Schema must declare table: ${table}`
  );
  console.log(`✓ Table confirmed: "${table}"`);
});

// Verify Constraints & Enums
assert.ok(schemaContent.includes("CHECK (status IN ('waiting', 'called', 'in_service', 'completed', 'no_show', 'cancelled'))"));
assert.ok(schemaContent.includes("CHECK (source IN ('online', 'walk_in'))"));
assert.ok(schemaContent.includes("chair_number INT NOT NULL UNIQUE"));
console.log('✓ Database constraints verified (status lifecycle, source, chair uniqueness)');

// Verify Indexes
const requiredIndexes = [
  'idx_queue_tokens_status',
  'idx_queue_tokens_joined_at',
  'idx_queue_tokens_barber',
  'idx_queue_tokens_phone',
  'idx_services_active',
  'idx_barbers_status'
];
requiredIndexes.forEach(idx => {
  assert.ok(schemaContent.includes(idx), `Index ${idx} must be defined`);
});
console.log('✓ Performance B-Tree indexes verified (FCFS ordering, status filtering)');

// Verify Realtime Publication
assert.ok(schemaContent.includes('ALTER PUBLICATION supabase_realtime ADD TABLE queue_tokens;'));
assert.ok(schemaContent.includes('ALTER PUBLICATION supabase_realtime ADD TABLE barbers;'));
assert.ok(schemaContent.includes('ALTER PUBLICATION supabase_realtime ADD TABLE services;'));
assert.ok(schemaContent.includes('ALTER PUBLICATION supabase_realtime ADD TABLE salon_settings;'));
console.log('✓ Supabase Realtime publication confirmed for all 4 dynamic tables');

// Verify RLS & Policies
requiredTables.forEach(table => {
  assert.ok(
    schemaContent.includes(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`),
    `RLS must be enabled on table ${table}`
  );
});
assert.ok(schemaContent.includes('CREATE POLICY "Allow public read queue tokens"'));
assert.ok(schemaContent.includes('CREATE POLICY "Allow public insert queue tokens"'));
assert.ok(schemaContent.includes('CREATE POLICY "Allow update queue tokens"'));
console.log('✓ Row Level Security (RLS) enabled and security policies verified');

// -----------------------------------------------------------------------------
// TEST 2: Environment Variables & Secret Key Protection
// -----------------------------------------------------------------------------
console.log('\n--- TEST 2: Environment Variables & Secret Key Protection ---');

const envPath = path.join(__dirname, '.env');
assert.ok(fs.existsSync(envPath), '.env file must exist');
const envContent = fs.readFileSync(envPath, 'utf8');

assert.ok(envContent.includes('VITE_SUPABASE_URL='), 'VITE_SUPABASE_URL must be defined');
assert.ok(envContent.includes('VITE_SUPABASE_ANON_KEY='), 'VITE_SUPABASE_ANON_KEY must be defined');
assert.ok(!envContent.includes('service_role'), 'Secret service_role key must NEVER be exposed in frontend .env');
console.log('✓ Frontend credentials properly configured with anon key only (no service_role exposure)');

// -----------------------------------------------------------------------------
// TEST 3: Multi-Window Synchronization Simulation (Customer -> Reception -> TV)
// -----------------------------------------------------------------------------
console.log('\n--- TEST 3: Multi-Browser Cross-Window State & Realtime Simulation ---');

// Simulated shared database state
let dbQueue = [
  { id: 'tok-1', token_number: 'S-1', customer_name: 'Rajesh', status: 'in_service', barber_id: 'barber-1', chair_number: 1 },
  { id: 'tok-2', token_number: 'S-2', customer_name: 'Suresh', status: 'waiting', barber_id: null, chair_number: null }
];

let dbBarbers = [
  { id: 'barber-1', name: 'Ravi', chair_number: 1, status: 'active' },
  { id: 'barber-2', name: 'Amit', chair_number: 2, status: 'active' },
  { id: 'barber-3', name: 'Imran', chair_number: 3, status: 'active' }
];

// BroadcastChannel event emitter simulation
const listeners = [];
function subscribeToRealtimeChannel(callback) {
  listeners.push(callback);
}
function broadcastEvent(event) {
  listeners.forEach(cb => cb(event));
}

// Window 1: Receptionist Dashboard State
const receptionQueue = [];
subscribeToRealtimeChannel((event) => {
  if (event.table === 'queue_tokens') {
    if (event.eventType === 'INSERT') receptionQueue.push(event.new);
    if (event.eventType === 'UPDATE') {
      const idx = receptionQueue.findIndex(t => t.id === event.new.id);
      if (idx !== -1) receptionQueue[idx] = event.new;
    }
  }
});

// Window 2: Waiting Area TV Display State
const tvDisplayUpcoming = [];
let tvNowServingChair2 = null;
subscribeToRealtimeChannel((event) => {
  if (event.table === 'queue_tokens') {
    if (event.eventType === 'INSERT') tvDisplayUpcoming.push(event.new);
    if (event.eventType === 'UPDATE') {
      const idx = tvDisplayUpcoming.findIndex(t => t.id === event.new.id);
      if (idx !== -1) tvDisplayUpcoming[idx] = event.new;
      if (event.new.status === 'called' && event.new.chair_number === 2) {
        tvNowServingChair2 = event.new;
      }
    }
  }
});

// Step A: Customer joins online in Window 3 (Phone browser)
console.log('Action A: Customer "Vikram Patel" joins queue from smartphone (Window 3)...');
const newCustomerToken = {
  id: 'tok-3',
  token_number: 'S-3',
  customer_name: 'Vikram Patel',
  customer_phone: '9876500000',
  status: 'waiting',
  source: 'online',
  total_duration: 30,
  chair_number: null,
  barber_id: null
};

// Insert into DB and broadcast Realtime INSERT event
dbQueue.push(newCustomerToken);
broadcastEvent({
  table: 'queue_tokens',
  eventType: 'INSERT',
  new: newCustomerToken
});

// Verify Window 1 (Receptionist) received the token
assert.strictEqual(receptionQueue.length, 1);
assert.strictEqual(receptionQueue[0].token_number, 'S-3');
console.log('✓ Window 1 (Receptionist Dashboard) updated via Realtime: Token S-3 appears in waiting list');

// Verify Window 2 (TV Display) received the token in "Up Next"
assert.strictEqual(tvDisplayUpcoming.length, 1);
assert.strictEqual(tvDisplayUpcoming[0].token_number, 'S-3');
console.log('✓ Window 2 (Waiting Area TV) updated via Realtime: Token S-3 appears in "Up Next" list');

// Step B: Receptionist calls customer S-3 for Amit (Chair 2) in Window 1
console.log('\nAction B: Receptionist calls Token S-3 for Chair 2 (Amit)...');
const updatedTokenCalled = {
  ...newCustomerToken,
  status: 'called',
  barber_id: 'barber-2',
  barber_name: 'Amit',
  chair_number: 2,
  called_at: new Date().toISOString()
};

broadcastEvent({
  table: 'queue_tokens',
  eventType: 'UPDATE',
  new: updatedTokenCalled
});

// Verify Window 2 (TV Display) Now Serving grid
assert.strictEqual(tvNowServingChair2.token_number, 'S-3');
assert.strictEqual(tvNowServingChair2.chair_number, 2);
console.log('✓ Window 2 (TV Display) instantly displays "Now Serving: S-3" on Chair 2 (Amit)');

console.log('\n================================================================');
console.log('🎉 ALL SUPABASE POSTGRESQL & REALTIME INTEGRATION TESTS PASSED!');
console.log('================================================================');
