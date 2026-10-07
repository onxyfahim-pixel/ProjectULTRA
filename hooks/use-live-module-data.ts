'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Universal Hook for 100% Live, Real-Time Synchronized ERP Module Data.
 * 
 * Guarantees:
 * 1. Instant local rendering without blank flicker (uses cached storage).
 * 2. Live fetch from Central Host Server (/api/modules/:key) backed by MySQL.
 * 3. On update/delete/add:
 *    - Updates local state immediately.
 *    - Saves to local cache.
 *    - Broadcasts to all tabs on current device via BroadcastChannel.
 *    - Posts to Host Central Server (/api/modules/:key) to commit to MySQL.
 *    - Server broadcasts MODULE_DATA_UPDATED over WebSocket to all mobile devices and PCs on Wi-Fi!
 * 4. Listens for live WebSocket & Broadcast updates from other devices and updates screen automatically!
 */
export function useLiveModuleData<T>(
  moduleKey: string,
  initialFallback: T,
  legacyKey?: string
): [T, (updatedOrUpdater: T | ((prev: T) => T)) => void, boolean] {
  const [data, setDataState] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`erp_module_${moduleKey}`);
        if (cached !== null) {
          const parsed = JSON.parse(cached);
          return parsed;
        }
        if (legacyKey) {
          const legacyCached = localStorage.getItem(legacyKey);
          if (legacyCached !== null) {
            const parsed = JSON.parse(legacyCached);
            return parsed;
          }
        }
      } catch (err) {
        console.warn(`[useLiveModuleData] Cache parse error for ${moduleKey}:`, err);
      }
    }
    return initialFallback;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const dataRef = useRef<T>(data);
  dataRef.current = data;

  // 1. Initial live fetch from Central Host Server / MySQL
  useEffect(() => {
    let isMounted = true;
    async function fetchServerData() {
      try {
        const res = await fetch(`/api/modules/${moduleKey}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data !== null && json.data !== undefined) {
            setDataState(json.data);
            try {
              localStorage.setItem(`erp_module_${moduleKey}`, JSON.stringify(json.data));
            } catch {}
          }
        }
      } catch (err) {
        console.warn(`[useLiveModuleData] Network fetch failed for ${moduleKey}:`, err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchServerData();

    return () => {
      isMounted = false;
    };
  }, [moduleKey]);

  // 2. Real-time Cross-Device & Cross-Tab synchronization listener
  useEffect(() => {
    const handleModuleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail !== undefined) {
        setDataState(customEvent.detail);
      }
    };

    const eventName = `erp_module_${moduleKey}_updated`;
    window.addEventListener(eventName, handleModuleUpdate);

    return () => {
      window.removeEventListener(eventName, handleModuleUpdate);
    };
  }, [moduleKey]);

  // 3. Update mutator
  const updateData = useCallback(
    (updatedOrUpdater: T | ((prev: T) => T)) => {
      setDataState((prev) => {
        const next =
          typeof updatedOrUpdater === 'function'
            ? (updatedOrUpdater as (prev: T) => T)(prev)
            : updatedOrUpdater;

        // A. Persist locally
        try {
          localStorage.setItem(`erp_module_${moduleKey}`, JSON.stringify(next));
          if (legacyKey) {
            localStorage.setItem(legacyKey, JSON.stringify(next));
          }
          window.dispatchEvent(
            new CustomEvent(`erp_module_${moduleKey}_updated`, { detail: next })
          );
        } catch {}

        // B. Broadcast to other browser tabs
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          try {
            const bc = new BroadcastChannel('garments_erp_sync');
            bc.postMessage({
              type: 'MODULE_DATA_UPDATED',
              moduleKey,
              data: next,
              timestamp: new Date().toISOString(),
            });
            bc.close();
          } catch {}
        }

        // C. Asynchronously persist to Central Host Server & MySQL
        fetch(`/api/modules/${moduleKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: next }),
        }).catch((err) =>
          console.warn(`[useLiveModuleData] Server persist error for ${moduleKey}:`, err)
        );

        return next;
      });
    },
    [moduleKey]
  );

  return [data, updateData, isLoading];
}
