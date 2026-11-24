import React, { createContext, useContext, useState, useEffect } from 'react';
import { dummyQueueTokens, dummyBarbers, dummyServices, dummySalonSettings } from '../data/dummyData';
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
const STORAGE_SERVICES_KEY = 'salon_shared_services_v2';
const STORAGE_QUEUE_OPEN_KEY = 'salon_shared_queue_open_v2';

export function QueueProvider({ children }) {
  // 1. Shared queue tokens state
  const [queue, setQueue] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_QUEUE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read saved queue, using defaults', e);
    }
    return dummyQueueTokens;
  });

  // 2. Shared barbers state (Ravi, Amit, Imran)
  const [barbers, setBarbers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_BARBERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read saved barbers, using defaults', e);
    }
    return dummyBarbers;
  });

  // 3. Shared services state (with isActive flag for turning on/off)
  const [services, setServices] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SERVICES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read saved services, using defaults', e);
    }
    return dummyServices.map(s => ({ ...s, isActive: true }));
  });

  // 4. Online Queue Open / Closed master control
  const [isQueueOpen, setIsQueueOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_QUEUE_OPEN_KEY);
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read queue open state', e);
    }
    return true;
  });

  // Salon settings
  const [salonSettings] = useState(dummySalonSettings);

  // Tracks newly called token to trigger TV screen ripple/glow and sound chime
  const [lastCalledToken, setLastCalledToken] = useState(null);

  // Persist to localStorage on change so tabs/views stay synced
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {}
  }, [queue]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BARBERS_KEY, JSON.stringify(barbers));
    } catch (e) {}
  }, [barbers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SERVICES_KEY, JSON.stringify(services));
    } catch (e) {}
  }, [services]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_QUEUE_OPEN_KEY, JSON.stringify(isQueueOpen));
    } catch (e) {}
  }, [isQueueOpen]);

  // Sync across different browser tabs/windows automatically
  useEffect(() => {
    const handleStorageChange = (e) => {
      try {
        if (e.key === STORAGE_QUEUE_KEY && e.newValue) setQueue(JSON.parse(e.newValue));
        if (e.key === STORAGE_BARBERS_KEY && e.newValue) setBarbers(JSON.parse(e.newValue));
        if (e.key === STORAGE_SERVICES_KEY && e.newValue) setServices(JSON.parse(e.newValue));
        if (e.key === STORAGE_QUEUE_OPEN_KEY && e.newValue !== null) setIsQueueOpen(JSON.parse(e.newValue));
      } catch (err) {}
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // =========================================================================
  // QUEUE & BARBER ACTIONS
  // =========================================================================

  const callNextCustomer = (barberId) => {
    const barber = barbers.find(b => b.id === barberId);
    if (!barber) return { success: false, reason: 'Barber not found' };

    if (isBarberBusy(barberId, queue)) {
      return { success: false, reason: `${barber.name} is currently busy with a customer` };
    }

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

  const startService = (tokenId) => {
    setQueue(prevQueue =>
      prevQueue.map(item =>
        item.id === tokenId ? { ...item, status: 'in_service', startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : item
      )
    );
  };

  const completeService = (tokenId) => {
    setQueue(prevQueue =>
      prevQueue.map(item =>
        item.id === tokenId ? { ...item, status: 'completed', completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : item
      )
    );
  };

  const setBarberStatus = (barberId, status) => {
    setBarbers(prevBarbers =>
      prevBarbers.map(b => (b.id === barberId ? { ...b, status } : b))
    );
  };

  const toggleBarberDuty = (barberId) => {
    setBarbers(prevBarbers =>
      prevBarbers.map(b => {
        if (b.id === barberId) {
          const newStatus = b.status === 'off_duty' ? 'active' : 'off_duty';
          return { ...b, status: newStatus };
        }
        return b;
      })
    );
  };

  const markNoShow = (tokenId) => {
    setQueue(prevQueue =>
      prevQueue.map(item => (item.id === tokenId ? { ...item, status: 'no_show' } : item))
    );
  };

  const cancelToken = (tokenId) => {
    setQueue(prevQueue =>
      prevQueue.map(item => (item.id === tokenId ? { ...item, status: 'cancelled' } : item))
    );
  };

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

  // =========================================================================
  // OWNER SETTINGS ACTIONS: SERVICES MANAGEMENT & QUEUE OPEN/CLOSE
  // =========================================================================

  /**
   * Turn a service on or off (Active / Inactive)
   * Rule: When turned off, it is hidden from the Join Queue screen.
   */
  const toggleServiceActive = (serviceId) => {
    setServices(prevServices =>
      prevServices.map(s =>
        s.id === serviceId ? { ...s, isActive: s.isActive === false ? true : false } : s
      )
    );
  };

  /**
   * Update service details (price, duration, names)
   */
  const updateService = (serviceId, updatedFields) => {
    setServices(prevServices =>
      prevServices.map(s =>
        s.id === serviceId ? { ...s, ...updatedFields } : s
      )
    );
  };

  /**
   * Add a new service to the catalog
   */
  const addService = (newService) => {
    const id = `srv-${Date.now()}`;
    const serviceToAdd = {
      id,
      name_en: newService.name_en || 'New Service',
      name_gu: newService.name_gu || newService.name_en || 'નવી સેવા',
      duration: parseInt(newService.duration, 10) || 30,
      price: parseInt(newService.price, 10) || 200,
      category: newService.category || 'Hair',
      description_en: newService.description_en || 'Salon service',
      description_gu: newService.description_gu || 'સલૂન સેવા',
      isActive: true,
    };
    setServices(prev => [...prev, serviceToAdd]);
    return serviceToAdd;
  };

  /**
   * Master Queue Open / Close toggle
   * Rule: When closed, disables online joining while allowing walk-ins.
   */
  const toggleQueueOpen = () => {
    setIsQueueOpen(prev => !prev);
  };

  const resetToDefaults = () => {
    setQueue(dummyQueueTokens);
    setBarbers(dummyBarbers);
    setServices(dummyServices.map(s => ({ ...s, isActive: true })));
    setIsQueueOpen(true);
    localStorage.removeItem(STORAGE_QUEUE_KEY);
    localStorage.removeItem(STORAGE_BARBERS_KEY);
    localStorage.removeItem(STORAGE_SERVICES_KEY);
    localStorage.removeItem(STORAGE_QUEUE_OPEN_KEY);
  };

  // =========================================================================
  // QUERY HELPERS & ANALYTICS METRICS
  // =========================================================================

  const getActiveCustomerForBarber = (barberId) => {
    return getActiveCustomerHelper(barberId, queue);
  };

  const getNextCustomerForBarber = (barberId) => {
    return getNextEligibleCustomer(barberId, queue);
  };

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

  // Today's Metrics
  const completedCount = queue.filter(t => t.status === 'completed').length;
  const noShowCount = queue.filter(t => t.status === 'no_show').length;
  // Base day analytics + live actions
  const customersServedToday = 14 + completedCount;
  const noShowsToday = 2 + noShowCount;
  const avgWaitTimeToday = 22; // Average wait time in minutes

  return (
    <QueueContext.Provider
      value={{
        queue,
        barbers,
        services,
        isQueueOpen,
        salonSettings,
        lastCalledToken,
        callNextCustomer,
        startService,
        completeService,
        setBarberStatus,
        toggleBarberDuty,
        markNoShow,
        cancelToken,
        addWalkIn,
        toggleServiceActive,
        updateService,
        addService,
        toggleQueueOpen,
        resetToDefaults,
        getActiveCustomerForBarber,
        getNextCustomerForBarber,
        getUpcomingTokens,
        customersServedToday,
        noShowsToday,
        avgWaitTimeToday,
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
