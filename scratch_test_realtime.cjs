const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = (match[2] || '').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value.trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY);

async function testRealtime() {
  console.log('Connecting to Realtime on:', env.VITE_SUPABASE_URL);

  let eventReceived = false;
  let testId = null;

  const channel = supabase
    .channel('test_realtime_probe')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_tokens' }, (payload) => {
      console.log('⚡ REALTIME EVENT RECEIVED!', payload.eventType, payload.new ? payload.new.token_number : payload);
      if (payload.new && payload.new.id === testId) {
        eventReceived = true;
      }
    })
    .subscribe(async (status) => {
      console.log('Channel subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed successfully! Now inserting test token...');
        const tokenNumber = 'RT-' + Math.floor(Math.random() * 900 + 100);
        const { data, error } = await supabase.from('queue_tokens').insert({
          token_number: tokenNumber,
          customer_name: 'Realtime Probe Customer',
          customer_phone: '9876500000',
          services: [{ name: 'Haircut', price: 200, duration: 30 }],
          status: 'waiting',
          source: 'online',
          total_duration: 30,
          total_price: 200,
          position: 999
        }).select().single();

        if (error) {
          console.error('Insert error:', error.message);
          process.exit(1);
        }

        testId = data.id;
        console.log('Inserted token:', data.token_number, 'with ID:', testId);

        // Wait 5 seconds to see if Realtime payload arrives
        setTimeout(async () => {
          if (eventReceived) {
            console.log('✅ PASS: Realtime event was received successfully!');
          } else {
            console.log('❌ FAIL: Realtime event was NOT received within 5 seconds!');
          }
          // Clean up by updating status to cancelled
          await supabase.from('queue_tokens').update({ status: 'cancelled' }).eq('id', testId);
          process.exit(eventReceived ? 0 : 1);
        }, 5000);
      }
    });
}

testRealtime();
