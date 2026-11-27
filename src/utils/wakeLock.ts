import { useEffect, useRef, useState } from 'react';

interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
}

export function useWakeLock(active: boolean): boolean {
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function requestLock() {
      if (!active) return;
      const nav = navigator as Navigator & {
        wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
      };
      if (!nav.wakeLock) return;
      try {
        const sentinel = await nav.wakeLock.request('screen');
        if (cancelled) {
          sentinel.release().catch(() => {});
          return;
        }
        sentinelRef.current = sentinel;
        setLocked(true);
      } catch {
        setLocked(false);
      }
    }

    function releaseLock() {
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {});
        sentinelRef.current = null;
      }
      setLocked(false);
    }

    if (active) {
      requestLock();
    } else {
      releaseLock();
    }

    const onVisibility = () => {
      if (active && document.visibilityState === 'visible') {
        requestLock();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      releaseLock();
    };
  }, [active]);

  return locked;
}
