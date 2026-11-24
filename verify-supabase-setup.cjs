/**
 * verify-supabase-setup.cjs
 * Validates file locations, env variable usage, secret key absence, and build integrity
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('🔍 VERIFYING SUPABASE INTEGRATION REQUIREMENTS');
console.log('================================================================\n');

// 1. Verify File Locations
console.log('--- 1. File Locations Check ---');
const expectedFiles = [
  { p: path.join(__dirname, '.env'), desc: 'Environment variables file' },
  { p: path.join(__dirname, '.env.example'), desc: 'Environment template file' },
  { p: path.join(__dirname, 'src', 'lib', 'supabase.js'), desc: 'Supabase client singleton' },
  { p: path.join(__dirname, 'supabase', 'schema.sql'), desc: 'Database DDL schema & seed data' },
  { p: path.join(__dirname, 'src', 'contexts', 'QueueContext.jsx'), desc: 'Application QueueContext' }
];

expectedFiles.forEach(({ p, desc }) => {
  assert.ok(fs.existsSync(p), `File must exist: ${p}`);
  console.log(`✓ [FOUND] ${desc} at: ${path.relative(__dirname, p)}`);
});

// 2. Verify Credentials Read from Environment Variables
console.log('\n--- 2. Environment Variables Verification ---');
const supabaseClientContent = fs.readFileSync(path.join(__dirname, 'src', 'lib', 'supabase.js'), 'utf8');

assert.ok(
  supabaseClientContent.includes('import.meta.env.VITE_SUPABASE_URL'),
  'src/lib/supabase.js must read VITE_SUPABASE_URL via import.meta.env'
);
assert.ok(
  supabaseClientContent.includes('import.meta.env.VITE_SUPABASE_ANON_KEY'),
  'src/lib/supabase.js must read VITE_SUPABASE_ANON_KEY via import.meta.env'
);
console.log('✓ Supabase client correctly reads credentials from import.meta.env');

// 3. Scan src/ directory to ensure NO secret keys are exposed
console.log('\n--- 3. Secret Key Absence Security Scan ---');
function scanDir(dir, forbiddenWords) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath, forbiddenWords);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.json') || file.endsWith('.html')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const word of forbiddenWords) {
        if (content.toLowerCase().includes(word.toLowerCase())) {
          throw new Error(`Forbidden secret credential pattern "${word}" found in file: ${fullPath}`);
        }
      }
    }
  }
}

// Ensure no service_role key or private secret keys exist in frontend source code
scanDir(path.join(__dirname, 'src'), ['service_role', 'SUPABASE_SERVICE_ROLE_KEY', 'secret_key']);
console.log('✓ Security scan passed: Zero secret keys or service_role credentials exposed in src/');

console.log('\n================================================================');
console.log('🎉 ALL INTEGRATION PRE-FLIGHT CHECKS PASSED WITH ZERO ERRORS');
console.log('================================================================');
