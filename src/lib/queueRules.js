/**
 * Reusable Queue Rules & Logic Engine for Salon Queue Management System
 * Defined based on docs/02-screens.md and docs/03-flows-rules.md
 */

// Key for persisting the sequential token counter
const TOKEN_COUNTER_KEY = 'salon_token_counter';
const QUEUE_STORAGE_KEY = 'salon_active_queue';

/**
 * 1. Token Number Generator
 * Generates unique tokens in the format: S-1, S-2, S-3...
 */
export function generateNextTokenNumber() {
  let counter = 1;
  try {
    const saved = localStorage.getItem(TOKEN_COUNTER_KEY);
    if (saved) {
      counter = parseInt(saved, 10) + 1;
    }
  } catch (e) {
    console.warn('LocalStorage unavailable, defaulting counter');
  }

  try {
    localStorage.setItem(TOKEN_COUNTER_KEY, counter.toString());
  } catch (e) {
    console.warn('Could not save token counter');
  }

  return `S-${counter}`;
}

/**
 * 2. Dynamic Wait-Time Calculation Formula
 * Based on docs/03-flows-rules.md
 * 
 * Scenario A (Specific Barber):
 * Wait Time = Remaining Time of Current Service + Sum(Duration of Preceding Waiting Customers) + (Buffer * N)
 * 
 * Scenario B (Any Available Barber):
 * Wait Time = (Sum(Remaining Time of All Active Barbers) + Sum(Duration of All Preceding Customers)) / ActiveBarbersCount + Buffer
 */
export function calculateDynamicWaitTime({
  barberId = null,
  precedingCustomers = [],
  activeBarbersCount = 3,
  bufferMinutes = 5,
  currentServiceRemainingMinutes = 10
}) {
  if (barberId && barberId !== 'any') {
    // Scenario A: Specific Barber chosen
    const precedingDuration = precedingCustomers
      .filter(c => c.barberId === barberId)
      .reduce((sum, c) => sum + (c.totalDuration || 30), 0);
    
    const count = precedingCustomers.filter(c => c.barberId === barberId).length;
    const wait = currentServiceRemainingMinutes + precedingDuration + (bufferMinutes * count);
    return Math.max(bufferMinutes, wait);
  } else {
    // Scenario B: Any Available Barber
    const totalPrecedingDuration = precedingCustomers.reduce(
      (sum, c) => sum + (c.totalDuration || 30),
      0
    );
    const activeChairs = Math.max(1, activeBarbersCount);
    const totalRemainingChairsTime = activeChairs * currentServiceRemainingMinutes;
    
    const computed = Math.round(
      (totalRemainingChairsTime + totalPrecedingDuration) / activeChairs + bufferMinutes
    );
    return Math.max(bufferMinutes, computed);
  }
}

/**
 * 3. Queue Position Determination
 * Calculates 1-based position and people ahead count.
 */
export function getQueuePosition(tokenId, queue = []) {
  const waitingQueue = queue.filter(
    item => item.status === 'waiting' || item.status === 'called'
  );
  
  const index = waitingQueue.findIndex(item => item.id === tokenId || item.tokenNumber === tokenId);
  
  if (index === -1) {
    return {
      position: 1,
      peopleAhead: 0,
      totalWaiting: waitingQueue.length
    };
  }

  const position = index + 1; // 1-based (1 = next in line, 2 = second in line)
  const peopleAhead = Math.max(0, index);

  return {
    position,
    peopleAhead,
    totalWaiting: waitingQueue.length
  };
}

/**
 * 4. Customer State Evaluator
 * Enforces strict state rules:
 * - "It's your turn": when status === 'called' (or called by receptionist)
 * - "Start coming": when position === 2 (second in line)
 * - "Waiting": when position > 2
 * - "In Service": when status === 'in_service'
 * - "Cancelled": when cancelled
 */
export function evaluateCustomerState({ token, queuePosition = 1 }) {
  if (!token) {
    return {
      code: 'unknown',
      titleEn: 'Unknown Status',
      titleGu: 'અજ્ઞાત સ્થિતિ',
      descEn: 'No active token found.',
      descGu: 'કોઈ સક્રિય ટોકન મળ્યો નથી.',
      theme: 'gray',
      isAlert: false
    };
  }

  // 1. Receptionist has called the customer
  if (token.status === 'called') {
    return {
      code: 'its_your_turn',
      titleEn: "It's your turn!",
      titleGu: "તમારો વારો આવી ગયો છે!",
      descEn: `Please proceed immediately to Chair #${token.chair || 1} (${token.barberName || 'Barber Station'}).`,
      descGu: `કૃપા કરીને તરત જ ખુરશી #${token.chair || 1} (${token.barberName || 'વાળંદ સ્ટેશન'}) પર પધારો.`,
      badgeEn: "IT'S YOUR TURN",
      badgeGu: "તમારો વારો આવી ગયો છે",
      theme: 'emerald-gold',
      isAlert: true,
      shouldChime: true
    };
  }

  // 2. Customer is currently sitting in chair
  if (token.status === 'in_service') {
    return {
      code: 'in_service',
      titleEn: 'In Service',
      titleGu: 'સેવા ચાલુ છે',
      descEn: 'Your styling service is currently in progress.',
      descGu: 'તમારી ગ્રુમિંગ સેવા હાલ ચાલુ છે.',
      badgeEn: 'IN SERVICE',
      badgeGu: 'સેવા ચાલુ છે',
      theme: 'emerald',
      isAlert: false
    };
  }

  // 3. Customer has cancelled
  if (token.status === 'cancelled') {
    return {
      code: 'cancelled',
      titleEn: 'Spot Cancelled',
      titleGu: 'સ્પોટ રદ કરેલ',
      descEn: 'You have cancelled your queue spot.',
      descGu: 'તમે તમારો કતાર સ્પોટ રદ કર્યો છે.',
      badgeEn: 'CANCELLED',
      badgeGu: 'રદ કરેલ',
      theme: 'rose',
      isAlert: false
    };
  }

  // 4. Waiting in queue: check position
  // SPEC REQUIREMENT: "Add the Start coming state when the customer is second in line."
  if (queuePosition === 2) {
    return {
      code: 'start_coming',
      titleEn: 'Start coming',
      titleGu: 'સલૂન તરફ આવવાનું શરૂ કરો',
      descEn: 'You are second in line (1 customer ahead). Please start heading to the salon now!',
      descGu: 'તમે કતારમાં બીજા નંબરે છો (આગળ 1 ગ્રાહક છે). કૃપા કરીને હવે સલૂન તરફ નીકળી જાઓ!',
      badgeEn: 'START COMING',
      badgeGu: 'સલૂન તરફ આવો',
      theme: 'gold-amber',
      isAlert: true
    };
  }

  // 5. Position 1 (Waiting next to be called)
  if (queuePosition === 1) {
    return {
      code: 'next_in_line',
      titleEn: 'Next in line',
      titleGu: 'પછીનો વારો તમારો છે',
      descEn: 'You are first in line! Please wait by the chairs, you will be called momentarily.',
      descGu: 'તમે કતારમાં પ્રથમ છો! કૃપા કરીને ખુરશી પાસે રહો, હમણાં જ તમને બોલાવવામાં આવશે.',
      badgeEn: 'NEXT IN LINE',
      badgeGu: 'આગળનો વારો',
      theme: 'gold',
      isAlert: false
    };
  }

  // 6. Position > 2 (Standard Waiting)
  return {
    code: 'waiting',
    titleEn: 'Waiting in Line',
    titleGu: 'કતારમાં રાહ જોઈ રહ્યા છો',
    descEn: `You are #${queuePosition} in line (${queuePosition - 1} customers ahead). We will notify you when to start coming!`,
    descGu: `તમે કતારમાં #${queuePosition} ક્રમે છો (આગળ ${queuePosition - 1} ગ્રાહકો છે). જ્યારે નીકળવાનો સમય થશે ત્યારે અમે જાણ કરીશું!`,
    badgeEn: 'WAITING',
    badgeGu: 'રાહ જોઈ રહ્યા છો',
    theme: 'amber',
    isAlert: false
  };
}

/**
 * 5. Native Web Audio API Chime Generator
 * Synthesizes a crisp luxury 2-tone chime for "It's your turn"
 */
export function playChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // First tone (E5: ~659 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.25, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.45);

    // Second tone (A5: ~880 Hz) - higher chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.18);
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.18);
    osc2.stop(ctx.currentTime + 0.95);
  } catch (err) {
    console.log('Web Audio chime not permitted without user gesture or unsupported');
  }
}
