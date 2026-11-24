/**
 * Reusable Queue Rules & Logic Engine for Salon Queue Management System
 * Defined based on docs/02-screens.md and docs/03-flows-rules.md
 */

// Keys for persisting the sequential token counters
const TOKEN_COUNTER_KEY = 'salon_token_counter';
const WALKIN_COUNTER_KEY = 'salon_walkin_counter';

/**
 * 1. Token Number Generator
 * Generates unique customer online tokens: S-1, S-2, S-3...
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
 * 1b. Walk-In Token Number Generator
 * Generates unique receptionist walk-in tokens: W-1, W-2, W-3...
 */
export function generateWalkInTokenNumber() {
  let counter = 1;
  try {
    const saved = localStorage.getItem(WALKIN_COUNTER_KEY);
    if (saved) {
      counter = parseInt(saved, 10) + 1;
    }
  } catch (e) {
    console.warn('LocalStorage unavailable, defaulting walk-in counter');
  }

  try {
    localStorage.setItem(WALKIN_COUNTER_KEY, counter.toString());
  } catch (e) {
    console.warn('Could not save walk-in counter');
  }

  return `W-${counter}`;
}

/**
 * 2. Barber Concurrency Check
 * Requirement: "Prevent a barber from receiving two customers simultaneously."
 * Returns true if the barber currently has an active customer ('called' or 'in_service').
 */
export function isBarberBusy(barberId, queue = []) {
  if (!barberId) return false;
  return queue.some(
    token => token.barberId === barberId && (token.status === 'called' || token.status === 'in_service')
  );
}

/**
 * 2b. Get Current Active Customer for a Barber
 */
export function getActiveCustomerForBarber(barberId, queue = []) {
  if (!barberId) return null;
  return queue.find(
    token => token.barberId === barberId && (token.status === 'called' || token.status === 'in_service')
  ) || null;
}

/**
 * 3. Barber-Preference Assignment Rules (Strict FCFS with Preference Filtering)
 * Requirement:
 * - Look at waiting customers in first-come, first-served (FCFS) order.
 * - Customer is eligible for barberId IF AND ONLY IF:
 *     a) status === 'waiting'
 *     AND
 *     b) (customer.barberId === barberId OR customer.barberId === 'any' OR customer.barberId === null)
 * - If customer specifically requested another barber, they are skipped.
 */
export function getNextEligibleCustomer(barberId, queue = []) {
  if (!barberId) return null;

  // Barber cannot call if already busy with a customer
  if (isBarberBusy(barberId, queue)) {
    return null;
  }

  // Find the first waiting customer matching the barber-preference rules
  return queue.find(token => {
    if (token.status !== 'waiting') return false;

    // Customer explicitly chose this barber
    if (token.barberId === barberId) return true;

    // Customer chose "Any Available Barber"
    if (!token.barberId || token.barberId === 'any') return true;

    // Customer specifically requested a different barber -> NOT eligible
    return false;
  }) || null;
}

/**
 * 4. Dynamic Wait-Time Calculation Formula
 * Based on docs/03-flows-rules.md
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
 * 5. Queue Position Determination
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

  const position = index + 1;
  const peopleAhead = Math.max(0, index);

  return {
    position,
    peopleAhead,
    totalWaiting: waitingQueue.length
  };
}

/**
 * 6. Customer State Evaluator
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

  if (token.status === 'no_show') {
    return {
      code: 'no_show',
      titleEn: 'Marked No-Show',
      titleGu: 'ગેરહાજર નોંધાયેલ',
      descEn: 'Your token was marked no-show.',
      descGu: 'તમારો ટોકન ગેરહાજર નોંધવામાં આવ્યો છે.',
      badgeEn: 'NO SHOW',
      badgeGu: 'ગેરહાજર',
      theme: 'rose',
      isAlert: false
    };
  }

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
 * 7. Native Web Audio API Chime Generator
 */
export function playChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
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
