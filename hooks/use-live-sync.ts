'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RealTimeEvent } from '@/lib/types/erp';

export interface LiveSyncState {
  status: 'connected' | 'connecting' | 'fallback' | 'offline';
  latencyMs: number;
  activeUsers: number;
  lastEvent: RealTimeEvent | null;
  recentEvents: Array<RealTimeEvent & { id: string }>;
  simulateMultiUserActivity: () => void;
}

export function useLiveSync(onEventReceived?: (event: RealTimeEvent) => void): LiveSyncState {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'fallback' | 'offline'>('connecting');
  const [latencyMs, setLatencyMs] = useState<number>(18);
  const [activeUsers, setActiveUsers] = useState<number>(4);
  const [lastEvent, setLastEvent] = useState<RealTimeEvent | null>(null);
  const [recentEvents, setRecentEvents] = useState<Array<RealTimeEvent & { id: string }>>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const pingStartRef = useRef<number>(0);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const isConnectedRef = useRef<boolean>(false);

  const handleIncomingEvent = useCallback(
    (event: RealTimeEvent) => {
      setLastEvent(event);
      setRecentEvents((prev) => [
        { ...event, id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}` },
        ...prev.slice(0, 14),
      ]);
      if (onEventReceived) {
        onEventReceived(event);
      }
    },
    [onEventReceived]
  );

  useEffect(() => {
    // 1. Cross-tab real-time communication via BroadcastChannel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('garments_erp_sync');
        broadcastChannelRef.current = channel;
        channel.onmessage = (msgEvent) => {
          if (msgEvent.data && msgEvent.data.type) {
            handleIncomingEvent(msgEvent.data);
          }
        };
      } catch {
        // ignore
      }
    }

    // 2. Try native WebSocket first
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let ws: WebSocket | null = null;
    let sseSource: EventSource | null = null;
    let pingInterval: any = null;

    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        isConnectedRef.current = true;
        setStatus('connected');
        pingStartRef.current = Date.now();
        ws?.send(JSON.stringify({ type: 'PING' }));

        // Send ping every 10 seconds to compute latency
        pingInterval = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            pingStartRef.current = Date.now();
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 10000);
      };

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.type === 'PONG') {
            const delta = Date.now() - pingStartRef.current;
            setLatencyMs(delta > 0 ? delta : 14);
            return;
          }
          if (data.type === 'CLIENTS_COUNT') {
            setActiveUsers(Math.max(data.count, 3));
            return;
          }
          if (data.type === 'WS_CONNECTED') {
            setActiveUsers(Math.max(data.activeClients || 3, 3));
            return;
          }

          // Real-time domain event
          handleIncomingEvent(data);
        } catch {
          // parse error
        }
      };

      ws.onerror = () => {
        // If native WS cannot connect through proxy, fall back to SSE
        if (!isConnectedRef.current) {
          initSseFallback();
        }
      };

      ws.onclose = () => {
        if (isConnectedRef.current) {
          isConnectedRef.current = false;
          initSseFallback();
        }
      };
    } catch {
      initSseFallback();
    }

    function initSseFallback() {
      try {
        sseSource = new EventSource('/api/live/stream');
        setStatus('fallback');
        setLatencyMs(24);

        sseSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'CONNECTED') {
              setStatus('fallback');
              return;
            }
            handleIncomingEvent(data);
          } catch {
            // ignore
          }
        };

        sseSource.onerror = () => {
          // If SSE is reconnecting, stay in fallback mode
        };
      } catch {
        setStatus('offline');
      }
    }

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      if (ws) {
        ws.close();
      }
      if (sseSource) {
        sseSource.close();
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, [handleIncomingEvent]);

  // Method to simulate concurrent user action (e.g. warehouse scanner updating inventory)
  const simulateMultiUserActivity = useCallback(() => {
    const locations = ['WH-R01-B04', 'WH-R02-B08', 'WH-R03-B02', 'WH-R04-B01'];
    const users = ['Automated RFID Gate #2', 'Jamal Uddin (Forklift 04)', 'Salma Begum (Inward QC)'];
    const selectedLocation = locations[Math.floor(Math.random() * locations.length)];
    const selectedUser = users[Math.floor(Math.random() * users.length)];

    const simEvent: RealTimeEvent = {
      type: 'WAREHOUSE_ACTIVITY',
      message: `Scanned & confirmed pallet weight: 24 rolls staged at ${selectedLocation}`,
      user: selectedUser,
      location: selectedLocation,
      timestamp: new Date().toISOString(),
    };

    handleIncomingEvent(simEvent);

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage(simEvent);
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'SIMULATE_WAREHOUSE_SYNC',
          user: selectedUser,
          location: selectedLocation,
          message: simEvent.message,
        })
      );
    }
  }, [handleIncomingEvent]);

  return {
    status,
    latencyMs,
    activeUsers,
    lastEvent,
    recentEvents,
    simulateMultiUserActivity,
  };
}
