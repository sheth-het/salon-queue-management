import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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

// -----------------------------------------------------------------------------
// HELPER: Validate standard UUID string format
// -----------------------------------------------------------------------------
const isValidUuid = (val) => {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
};

// -----------------------------------------------------------------------------
// ADAPTER HELPERS: Map between Supabase snake_case & UI camelCase models
// -----------------------------------------------------------------------------
function mapDbTokenToUi(dbRow) {
  if (!dbRow) return null;
  return {
    id: dbRow.id,
    tokenNumber: dbRow.token_number,
    customerName: dbRow.customer_name,
    phone: dbRow.customer_phone || '',
    services: Array.isArray(dbRow.services) 
      ? dbRow.services.map(s => typeof s === 'string' ? s : s.name || s.name_en || s) 
      : [],
    totalDuration: dbRow.total_duration || 30,
    totalPrice: dbRow.total_price || 200,
    barberId: dbRow.barber_id,
    barberName: dbRow.barber_name || 'Any Available Stylist',
    chair: dbRow.chair_number || null,
    status: dbRow.status || 'waiting',
    source: dbRow.source || 'online',
    position: dbRow.position || 1,
    estimatedWaitMinutes: dbRow.estimated_wait_minutes || 15,
    joinedAt: dbRow.joined_at ? new Date(dbRow.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    joinedAtRaw: dbRow.joined_at || dbRow.created_at || new Date().toISOString(),
    calledAt: dbRow.called_at ? new Date(dbRow.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
    startedAt: dbRow.started_at ? new Date(dbRow.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
    completedAt: dbRow.completed_at ? new Date(dbRow.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
    elapsedMinutes: 0,
  };
}

function mapDbBarberToUi(dbRow) {
  if (!dbRow) return null;
  return {
    id: dbRow.id,
    name: dbRow.name,
    nameGu: dbRow.name_gu || dbRow.name,
    chair: dbRow.chair_number,
    status: dbRow.status || 'active',
    isActive: dbRow.is_active !== false,
  };
}

function mapDbServiceToUi(dbRow) {
  if (!dbRow) return null;
  return {
    id: dbRow.id,
    name_en: dbRow.name_en,
    name_gu: dbRow.name_gu,
    duration: dbRow.duration_minutes || 30,
    price: dbRow.price || 200,
    category: dbRow.category || 'Hair',
    description_en: dbRow.description_en || '',
    description_gu: dbRow.description_gu || '',
    isActive: dbRow.is_active !== false,
  };
}

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
  const [salonSettings, setSalonSettings] = useState(dummySalonSettings);

  // Tracks newly called token to trigger TV screen ripple/glow and sound chime
  const [lastCalledToken, setLastCalledToken] = useState(null);

  // Supabase real-time connection status
  const [dbConnected, setDbConnected] = useState(isSupabaseConfigured);

  // =========================================================================
  // SUPABASE POSTGRESQL & REALTIME SUBSCRIPTION
  // =========================================================================
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    let isMounted = true;

    // 1. Initial Data Fetch from Supabase
    async function fetchInitialData() {
      try {
        // Fetch Salon Settings
        const { data: settingsData } = await supabase
          .from('salon_settings')
          .select('*')
          .limit(1)
          .single();

        if (settingsData && isMounted) {
          setIsQueueOpen(settingsData.is_queue_open);
          setSalonSettings(prev => ({
            ...prev,
            salonName: settingsData.salon_name,
            isQueueOpen: settingsData.is_queue_open,
            maxQueueCapacity: settingsData.max_queue_capacity,
            bufferMinutes: settingsData.buffer_minutes,
          }));
        }

        // Fetch Services
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .order('created_at', { ascending: true });

        if (servicesData && servicesData.length > 0 && isMounted) {
          setServices(servicesData.map(mapDbServiceToUi));
        }

        // Fetch Barbers
        const { data: barbersData } = await supabase
          .from('barbers')
          .select('*')
          .order('chair_number', { ascending: true });

        if (barbersData && barbersData.length > 0 && isMounted) {
          setBarbers(barbersData.map(mapDbBarberToUi));
        }

        // Fetch Active Queue Tokens
        const { data: queueData } = await supabase
          .from('queue_tokens')
          .select('*')
          .order('joined_at', { ascending: true });

        if (queueData && isMounted) {
          setQueue(queueData.map(mapDbTokenToUi));
        }

        if (isMounted) setDbConnected(true);
      } catch (err) {
        console.warn('Error fetching initial data from Supabase:', err);
      }
    }

    fetchInitialData();

    // 2. Realtime Channel Subscription for live cross-window synchronizations
    const channel = supabase
      .channel('salon_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_tokens' }, (payload) => {
        if (!isMounted) return;

        if (payload.eventType === 'INSERT') {
          const newUiToken = mapDbTokenToUi(payload.new);
          setQueue(prev => {
            if (prev.some(t => t.id === newUiToken.id)) return prev;
            const nextList = [...prev, newUiToken];
            return nextList.sort((a, b) => {
              const timeA = new Date(a.joinedAtRaw || a.joinedAt || 0).getTime();
              const timeB = new Date(b.joinedAtRaw || b.joinedAt || 0).getTime();
              return timeA - timeB;
            });
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedUiToken = mapDbTokenToUi(payload.new);
          if (updatedUiToken.status === 'called') {
            setLastCalledToken(updatedUiToken.tokenNumber);
            playChime();
          }
          setQueue(prev => prev.map(t => t.id === updatedUiToken.id ? { ...t, ...updatedUiToken } : t));
        } else if (payload.eventType === 'DELETE') {
          setQueue(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barbers' }, (payload) => {
        if (!isMounted) return;
        if (payload.eventType === 'UPDATE') {
          const updatedBarber = mapDbBarberToUi(payload.new);
          setBarbers(prev => prev.map(b => b.id === updatedBarber.id ? { ...b, ...updatedBarber } : b));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, (payload) => {
        if (!isMounted) return;
        if (payload.eventType === 'INSERT') {
          const newService = mapDbServiceToUi(payload.new);
          setServices(prev => [...prev, newService]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedService = mapDbServiceToUi(payload.new);
          setServices(prev => prev.map(s => s.id === updatedService.id ? { ...s, ...updatedService } : s));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salon_settings' }, (payload) => {
        if (!isMounted) return;
        if (payload.new) {
          setIsQueueOpen(payload.new.is_queue_open);
          setSalonSettings(prev => ({
            ...prev,
            isQueueOpen: payload.new.is_queue_open,
            maxQueueCapacity: payload.new.max_queue_capacity,
            bufferMinutes: payload.new.buffer_minutes,
          }));
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('⚡ Connected to Supabase Realtime channel');
        }
      });

    // 3. Resilience Polling: Background 5-second sync to ensure TV Kiosks never go stale
    const syncInterval = setInterval(() => {
      if (isMounted) {
        fetchInitialData();
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(syncInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Persist to localStorage on change so tabs/views stay synced even without remote backend
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

  // Cross-browser-tab synchronization via storage event
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
  // QUEUE & BARBER ACTIONS (WITH SUPABASE INTEGRATION)
  // =========================================================================

  /**
   * Online Customer Joins Queue
   * Inserts into Supabase queue_tokens and synchronizes cross-window state
   */
  const joinOnlineQueue = async (tokenData) => {
    // 1. If Supabase is configured, write directly to database
    if (isSupabaseConfigured && supabase) {
      try {
        let customerId = null;
        if (tokenData.phone) {
          try {
            const { data: custData } = await supabase
              .from('customers')
              .insert({
                name: tokenData.customerName,
                phone: tokenData.phone,
              })
              .select('id')
              .single();
            if (custData) customerId = custData.id;
          } catch (custErr) {
            console.warn('Customer directory optional insert notice:', custErr);
          }
        }

        // Resolve barber UUID safely so invalid non-UUID strings never crash PostgreSQL
        let resolvedBarberId = null;
        if (tokenData.barberId && isValidUuid(tokenData.barberId)) {
          resolvedBarberId = tokenData.barberId;
        } else if (tokenData.barberId && tokenData.barberId !== 'any') {
          const matchedBarber = barbers.find(
            (b) =>
              b.id === tokenData.barberId ||
              b.name?.toLowerCase() === tokenData.barberName?.toLowerCase() ||
              b.chair === tokenData.chair
          );
          if (matchedBarber && isValidUuid(matchedBarber.id)) {
            resolvedBarberId = matchedBarber.id;
          }
        }

        // Format services JSON snapshot cleanly for PostgreSQL jsonb column
        const servicesPayload = Array.isArray(tokenData.services)
          ? tokenData.services.map((s) => {
              if (typeof s === 'string') return { name: s };
              return {
                id: s.id,
                name: s.name_en || s.name || s.name_gu,
                duration: s.duration || s.duration_minutes || 30,
                price: s.price || 200,
                category: s.category || 'Hair',
              };
            })
          : [];

        const validServiceIds = Array.isArray(tokenData.services)
          ? tokenData.services
              .map((s) => (typeof s === 'object' ? s.id : null))
              .filter((id) => isValidUuid(id))
          : [];

        const dbRow = {
          token_number: tokenData.tokenNumber,
          customer_id: customerId,
          customer_name: tokenData.customerName,
          customer_phone: tokenData.phone || null,
          service_ids: validServiceIds,
          services: servicesPayload,
          barber_id: resolvedBarberId,
          barber_name: tokenData.barberName || 'Any Available Stylist',
          chair_number: tokenData.chair || 1,
          status: 'waiting',
          source: 'online',
          total_duration: tokenData.totalDuration || 30,
          total_price: tokenData.totalPrice || 200,
          position: tokenData.position || queue.filter((t) => t.status === 'waiting').length + 1,
          estimated_wait_minutes: tokenData.estimatedWaitMinutes || 15,
        };

        const { data, error } = await supabase
          .from('queue_tokens')
          .insert(dbRow)
          .select()
          .single();

        if (error) {
          console.error('Supabase queue_tokens insert error:', error);
          return {
            success: false,
            error: `${error.message || 'Database insert failed'} (Code: ${error.code || 'UNKNOWN'})`,
          };
        }

        // Map the database record to our frontend model
        const createdUiToken = mapDbTokenToUi(data);
        setQueue((prev) => {
          if (prev.some((t) => t.id === createdUiToken.id)) return prev;
          return [...prev, createdUiToken];
        });

        return {
          success: true,
          token: createdUiToken,
        };
      } catch (err) {
        console.error('Unexpected error inserting into Supabase:', err);
        return {
          success: false,
          error: err.message || 'An unexpected error occurred while communicating with Supabase.',
        };
      }
    }

    // 2. Fallback mode if Supabase credentials are not configured in .env
    const fallbackToken = {
      ...tokenData,
      id: tokenData.id || `tok-${Date.now()}`,
    };
    setQueue((prev) => [...prev, fallbackToken]);
    return {
      success: true,
      token: fallbackToken,
    };
  };

  /**
   * Receptionist Calls Next Eligible Customer
   */
  const callNextCustomer = async (barberId) => {
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

    const callTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Update local state
    setQueue(prev => prev.map(item => {
      if (item.id === eligibleCustomer.id) {
        return {
          ...item,
          status: 'called',
          barberId: barber.id,
          barberName: barber.name,
          chair: barber.chair,
          calledAt: callTimeStr,
        };
      }
      return item;
    }));

    setLastCalledToken(eligibleCustomer.tokenNumber);
    playChime();

    // Update Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('queue_tokens')
          .update({
            status: 'called',
            barber_id: barber.id,
            barber_name: barber.name,
            chair_number: barber.chair,
            called_at: new Date().toISOString(),
          })
          .eq('id', eligibleCustomer.id);
      } catch (err) {
        console.warn('Could not update called token in Supabase:', err);
      }
    }

    return { 
      success: true, 
      customer: eligibleCustomer, 
      tokenNumber: eligibleCustomer.tokenNumber,
      barber 
    };
  };

  /**
   * Barber Starts Service
   */
  const startService = async (tokenId) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setQueue(prevQueue =>
      prevQueue.map(item =>
        item.id === tokenId ? { ...item, status: 'in_service', startedAt: timeStr } : item
      )
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('queue_tokens')
          .update({
            status: 'in_service',
            started_at: new Date().toISOString(),
          })
          .eq('id', tokenId);
      } catch (err) {
        console.warn('Could not update startService in Supabase:', err);
      }
    }
  };

  /**
   * Barber Completes Service
   */
  const completeService = async (tokenId) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setQueue(prevQueue =>
      prevQueue.map(item =>
        item.id === tokenId ? { ...item, status: 'completed', completedAt: timeStr } : item
      )
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('queue_tokens')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', tokenId);
      } catch (err) {
        console.warn('Could not update completeService in Supabase:', err);
      }
    }
  };

  /**
   * Set Barber Shift Status
   */
  const setBarberStatus = async (barberId, status) => {
    setBarbers(prevBarbers =>
      prevBarbers.map(b => (b.id === barberId ? { ...b, status } : b))
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('barbers')
          .update({ status })
          .eq('id', barberId);
      } catch (err) {
        console.warn('Could not update barber status in Supabase:', err);
      }
    }
  };

  /**
   * Toggle Barber On/Off Duty
   */
  const toggleBarberDuty = async (barberId) => {
    let nextStatus = 'active';
    setBarbers(prevBarbers =>
      prevBarbers.map(b => {
        if (b.id === barberId) {
          nextStatus = b.status === 'off_duty' ? 'active' : 'off_duty';
          return { ...b, status: nextStatus };
        }
        return b;
      })
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('barbers')
          .update({ status: nextStatus })
          .eq('id', barberId);
      } catch (err) {
        console.warn('Could not toggle barber duty in Supabase:', err);
      }
    }
  };

  /**
   * Mark Customer No-Show
   */
  const markNoShow = async (tokenId) => {
    setQueue(prevQueue =>
      prevQueue.map(item => (item.id === tokenId ? { ...item, status: 'no_show' } : item))
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('queue_tokens')
          .update({ status: 'no_show' })
          .eq('id', tokenId);
      } catch (err) {
        console.warn('Could not mark no-show in Supabase:', err);
      }
    }
  };

  /**
   * Cancel Token Spot
   */
  const cancelToken = async (tokenId) => {
    setQueue(prevQueue =>
      prevQueue.map(item => (item.id === tokenId ? { ...item, status: 'cancelled' } : item))
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('queue_tokens')
          .update({ status: 'cancelled' })
          .eq('id', tokenId);
      } catch (err) {
        console.warn('Could not cancel token in Supabase:', err);
      }
    }
  };

  /**
   * Front-Desk Walk-In Customer Registration
   */
  const addWalkIn = async ({ customerName, phone, services, barberId }) => {
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
      barberId: barberId === 'any' ? null : barberId,
      barberName: chosenBarberObj ? chosenBarberObj.name : 'Any Available Stylist',
      chair: chosenBarberObj ? chosenBarberObj.chair : null,
      status: 'waiting',
      source: 'walk_in',
      joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      elapsedMinutes: 0
    };

    setQueue(prevQueue => [...prevQueue, newWalkIn]);

    if (isSupabaseConfigured && supabase) {
      try {
        let resolvedBarberId = null;
        if (newWalkIn.barberId && isValidUuid(newWalkIn.barberId)) {
          resolvedBarberId = newWalkIn.barberId;
        } else if (newWalkIn.barberId && newWalkIn.barberId !== 'any') {
          const matched = barbers.find(b => b.id === newWalkIn.barberId || b.name?.toLowerCase() === newWalkIn.barberName?.toLowerCase());
          if (matched && isValidUuid(matched.id)) resolvedBarberId = matched.id;
        }

        const { data } = await supabase
          .from('queue_tokens')
          .insert({
            token_number: tokenNumber,
            customer_name: newWalkIn.customerName,
            customer_phone: newWalkIn.phone,
            barber_id: resolvedBarberId,
            barber_name: newWalkIn.barberName,
            chair_number: newWalkIn.chair,
            status: 'waiting',
            source: 'walk_in',
            total_duration: newWalkIn.totalDuration,
            total_price: newWalkIn.totalPrice,
            services: newWalkIn.services,
          })
          .select()
          .single();

        if (data) {
          setQueue(prev => prev.map(t => t.id === newWalkIn.id ? { ...t, id: data.id } : t));
        }
      } catch (err) {
        console.warn('Could not insert walk-in to Supabase:', err);
      }
    }

    return newWalkIn;
  };

  /**
   * Reassign Customer to Another Barber Chair
   */
  const reassignCustomerBarber = async (tokenId, newBarberId) => {
    const chosenBarber = barbers.find(b => b.id === newBarberId);
    setQueue(prevQueue =>
      prevQueue.map(item => {
        if (item.id === tokenId) {
          return {
            ...item,
            barberId: newBarberId === 'any' ? null : newBarberId,
            barberName: chosenBarber ? chosenBarber.name : 'Any Available Stylist',
            chair: chosenBarber ? chosenBarber.chair : null,
          };
        }
        return item;
      })
    );

    if (isSupabaseConfigured && supabase) {
      try {
        let resolvedBarberId = null;
        if (newBarberId && isValidUuid(newBarberId)) {
          resolvedBarberId = newBarberId;
        } else if (newBarberId && newBarberId !== 'any') {
          const matched = barbers.find(b => b.id === newBarberId || b.name?.toLowerCase() === chosenBarber?.name?.toLowerCase());
          if (matched && isValidUuid(matched.id)) resolvedBarberId = matched.id;
        }

        await supabase
          .from('queue_tokens')
          .update({
            barber_id: resolvedBarberId,
            barber_name: chosenBarber ? chosenBarber.name : 'Any Available Stylist',
            chair_number: chosenBarber ? chosenBarber.chair : null,
          })
          .eq('id', tokenId);
      } catch (err) {
        console.warn('Could not reassign barber in Supabase:', err);
      }
    }
  };

  // =========================================================================
  // OWNER SETTINGS ACTIONS: SERVICES MANAGEMENT & QUEUE OPEN/CLOSE
  // =========================================================================

  /**
   * Turn a service on or off (Active / Inactive)
   */
  const toggleServiceActive = async (serviceId) => {
    let nextActive = true;
    setServices(prevServices =>
      prevServices.map(s => {
        if (s.id === serviceId) {
          nextActive = s.isActive === false ? true : false;
          return { ...s, isActive: nextActive };
        }
        return s;
      })
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('services')
          .update({ is_active: nextActive })
          .eq('id', serviceId);
      } catch (err) {
        console.warn('Could not toggle service active in Supabase:', err);
      }
    }
  };

  /**
   * Update service details (price, duration, names)
   */
  const updateService = async (serviceId, updatedFields) => {
    setServices(prevServices =>
      prevServices.map(s => (s.id === serviceId ? { ...s, ...updatedFields } : s))
    );

    if (isSupabaseConfigured && supabase) {
      try {
        const dbFields = {};
        if (updatedFields.name_en) dbFields.name_en = updatedFields.name_en;
        if (updatedFields.name_gu) dbFields.name_gu = updatedFields.name_gu;
        if (updatedFields.price !== undefined) dbFields.price = updatedFields.price;
        if (updatedFields.duration !== undefined) dbFields.duration_minutes = updatedFields.duration;

        await supabase
          .from('services')
          .update(dbFields)
          .eq('id', serviceId);
      } catch (err) {
        console.warn('Could not update service in Supabase:', err);
      }
    }
  };

  /**
   * Add a new service to the catalog
   */
  const addService = async (newService) => {
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

    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('services')
          .insert({
            name_en: serviceToAdd.name_en,
            name_gu: serviceToAdd.name_gu,
            duration_minutes: serviceToAdd.duration,
            price: serviceToAdd.price,
            category: serviceToAdd.category,
            is_active: true,
          })
          .select()
          .single();

        if (data) {
          setServices(prev => prev.map(s => s.id === serviceToAdd.id ? mapDbServiceToUi(data) : s));
        }
      } catch (err) {
        console.warn('Could not add service to Supabase:', err);
      }
    }

    return serviceToAdd;
  };

  /**
   * Master Queue Open / Close toggle
   */
  const toggleQueueOpen = async () => {
    const nextState = !isQueueOpen;
    setIsQueueOpen(nextState);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('salon_settings')
          .update({ is_queue_open: nextState })
          .neq('id', '00000000-0000-0000-0000-000000000000'); // updates the settings row
      } catch (err) {
        console.warn('Could not toggle queue open in Supabase:', err);
      }
    }
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

  const getActiveCustomerForBarber = useCallback((barberId) => {
    const barber = barbers.find(b => b.id === barberId || b.chair === barberId);
    return queue.find(token => {
      if (token.status !== 'called' && token.status !== 'in_service') return false;
      if (token.barberId && token.barberId === barberId) return true;
      if (barber && token.barberId && token.barberId === barber.id) return true;
      if (barber && token.chair && barber.chair && token.chair === barber.chair) return true;
      return false;
    }) || null;
  }, [queue, barbers]);

  const getNextCustomerForBarber = useCallback((barberId) => {
    return getNextEligibleCustomer(barberId, queue);
  }, [queue]);

  const getUpcomingTokens = useCallback((limit = 10) => {
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
        calculatedWaitMinutes: estWait,
        queueRank: index + 1
      };
    });
  }, [queue, barbers, salonSettings.bufferMinutes]);

  // Today's Metrics
  const completedCount = queue.filter(t => t.status === 'completed').length;
  const noShowCount = queue.filter(t => t.status === 'no_show').length;
  const customersServedToday = 14 + completedCount;
  const noShowsToday = 2 + noShowCount;
  const avgWaitTimeToday = 22;

  return (
    <QueueContext.Provider
      value={{
        queue,
        barbers,
        services,
        isQueueOpen,
        salonSettings,
        lastCalledToken,
        dbConnected,
        joinOnlineQueue,
        callNextCustomer,
        startService,
        completeService,
        setBarberStatus,
        toggleBarberDuty,
        markNoShow,
        cancelToken,
        addWalkIn,
        reassignCustomerBarber,
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
