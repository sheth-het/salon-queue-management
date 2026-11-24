import React, { createContext, useContext, useState, useEffect } from 'react';
import { dummyQueueTokens, dummyBarbers, dummySalonSettings } from '../data/dummyData';
import { 
  getNextEligibleCustomer, 
  isBarberBusy, 
  getActiveCustomerForBarber as getActiveCustomerHelper,
  generateWalkInTokenNumber,
  generateNextTokenNumber,
  calculateDynamicWaitTime,
  playChime
} from '../lib/queueRules';

const QueueContext = createContext();

const STORAGE_QUEUE_KEY = 'salon_shared_queue_v2';
const STORAGE_BARBERS_KEY = 'salon_shared_barbers_v2';

export function QueueProvider({ children }) {
  // Shared queue tokens state
  const [queue, setQueue] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_QUEUE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read saved queue, using defaults', e);
    }
    return dummyQueueTokens;
  });

  // Shared barbers state (Ravi, Amit, Imran)
  const [barbers, setBarbers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_BARBERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read saved barbers, using defaults', e);
    }
    return dummyBarbers;
  });

  // Salon settings
  const [salonSettings] = useState(dummySalonSettings);

  // Tracks newly called token to trigger TV screen ripple/glow and sound chime
  const [lastCalledToken, setLastCalledToken] = useState(null);

  // Persist to localStorage on change so tabs/views stay synced
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('Could not persist queue', e);
    }
  }, [queue]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BARBERS_KEY, JSON.stringify(barbers));
    } catch (e) {
      console.warn('Could not persist barbers', e);
    }
  }, [barbers]);

  // Sync across different browser tabs/windows automatically
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_QUEUE_KEY && e.newValue) {
        try {
          setQueue(JSON.parse(e.newValue));
        } catch (err) {}
      }
      if (e.key === STORAGE_BARBERS_KEY && e.newValue) {
        try {
          setBarbers(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // =========================================================================
  // QUEUE ACTIONS
  // =========================================================================

  /**
   * Call next eligible customer for a specific barber
   */
  const callNextCustomer = (barberId) => {
    const barber = barbers.find(b => b.id === barberId);
    if (!barber) return { success: false, reason: 'Barber not found' };

    // Concurrency guard: barber cannot take two customers simultaneously
    if (isBarberBusy(barberId, queue)) {
      return { success: false, reason: `${barber.name} is currently busy with a customer` };
    }

    // Barber-preference & FCFS rule
    const eligibleCustomer = getNextEligibleCustomer(barberId, queue);
    if (!eligibleCustomer) {
      return { 
        success: false, 
        reason: `No eligible waiting customers for ${barber.name} (none requested ${barber.name} or "Any Stylist")` 
      };
    }

    const updatedQueue = queue.map(item => {
      if (item.id === eligibleCustomer.id) {
        return {
          ...item,
          status: 'called',
          barberId: barber.id,
          barberName: barber.name,
          chair: barber.chair,
          calledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }
      return item;
    });

    setQueue(updatedQueue);
    setLastCalledToken(eligibleCustomer.tokenNumber);
    playChime();

    return { 
      success: true, 
      customer: eligibleCustomer, 
      tokenNumber: eligibleCustomer.tokenNumber,
      barber 
    };
  };

  /**
   * START SERVICE: Customer sits in chair -> status changes from 'called' to 'in_service'
   */
  const startService = (tokenId) => {
    setQueue(prevQueue =>
      prevQueue.map(item =>
        item.id === tokenId ? { ...item, status: 'in_service', startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : item
      )
    );
  };

  /**
   * DONE / COMPLETE SERVICE: Service finishes -> status changes to 'completed' and frees chair
   */
  const completeService = (tokenId) => {
    setQueue(prevQueue =>
      prevQueue.map(item =>
        item.id === tokenId ? { ...item, status: 'completed', completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : item
      )
    );
  };

  /**
   * BARBER STATUS TOGGLE: Available ('active') vs On Break ('break') vs Off Duty ('off_duty')
   */
  const setBarberStatus = (barberId, status) => {
    setBarbers(prevBarbers =>
      prevBarbers.map(b => (b.id === barberId ? { ...b, status } : b))
    );
  };

  /**
   * MARK NO-SHOW: Customer did not report
   */
  const markNoShow = (tokenId) => {
    setQueue(prevQueue =>
      prevQueue.map(item => (item.id === tokenId ? { ...item, status: 'no_show' } : item))
    );
  };

  /**
   * CANCEL SPOT
   */
  const cancelToken = (tokenId) => {
    setQueue(prevQueue =>
      prevQueue.map(item => (item.id === tokenId ? { ...item, status: 'cancelled' } : item))
    );
  };

  /**
   * ADD WALK-IN CUSTOMER
   */
  const addWalkIn = ({ customerName, phone, services, barberId }) => {
    const tokenNumber = generateWalkInTokenNumber();
    const chosenBarberObj = barbers.find(b => b.id === barberId);

    const newWalkIn = {
      id: `walkin-${Date.now()}`,
      tokenNumber,
      customerName: customerName.trim(),
      phone: phone || 'Walk-In Guest',
      services: services.map(s => s.name || s),
      totalDuration: services.reduce((sum, s) => sum + (s.duration || 30), 0) || 30,
      totalPrice: services.reduce((sum, s) => sum + (s.price || 200), 0) || 200,
      barberId: barberId === 'any' ? 'any' : barberId,
      barberName: chosenBarberObj ? chosenBarberObj.name : 'Any Stylist',
      chair: chosenBarberObj ? chosenBarberObj.chair : null,
      status: 'waiting',
      source: 'walk_in',
      joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      elapsedMinutes: 0
    };

    setQueue(prevQueue => [...prevQueue, newWalkIn]);
    return newWalkIn;
  };

  /**
   * RESET STATE TO DEFAULTS (For test resets)
   */
  const resetToDefaults = () => {
    setQueue(dummyQueueTokens);
    setBarbers(dummyBarbers);
    localStorage.removeItem(STORAGE_QUEUE_KEY);
    localStorage.removeItem(STORAGE_BARBERS_KEY);
  };

  // =========================================================================
  // QUERY HELPERS FOR SCREENS
  // =========================================================================

  const getActiveCustomerForBarber = (barberId) => {
    return getActiveCustomerHelper(barberId, queue);
  };

  const getNextCustomerForBarber = (barberId) => {
    return getNextEligibleCustomer(barberId, queue);
  };

  /**
   * UP NEXT TOKENS (For Waiting Area TV Display)
   * Returns the next 5 tokens in waiting status with dynamically calculated wait times
   */
  const getUpcomingTokens = (limit = 5) => {
    const waitingTokens = queue.filter(item => item.status === 'waiting');
    return waitingTokens.slice(0, limit).map((token, index) => {
      const preceding = waitingTokens.slice(0, index);
      const estWait = calculateDynamicWaitTime({
        barberId: token.barberId,
        precedingCustomers: preceding,
        activeBarbersCount: barbers.filter(b => b.status === 'active').length || 1,
        bufferMinutes: salonSettings.bufferMinutes || 5
      });
      return {
        ...token,
        calculatedWaitMinutes: estWait
      };
    });
  };

  return (
    <QueueContext.Provider
      value={{
        queue,
        barbers,
        salonSettings,
        lastCalledToken,
        callNextCustomer,
        startService,
        completeService,
        setBarberStatus,
        markNoShow,
        cancelToken,
        addWalkIn,
        resetToDefaults,
        getActiveCustomerForBarber,
        getNextCustomerForBarber,
        getUpcomingTokens,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
}
