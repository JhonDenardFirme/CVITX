// lib/usePolling.js
"use client";
import { useEffect, useRef } from "react";

/**
 * usePolling(tick, { intervalMs, backoffAfter, backoffMs, enabled })
 * - tick: async () => boolean | void  (return false to stop)
 */
export function usePolling(tick, opts = {}) {
  const {
    intervalMs = 3000,
    backoffAfter = 10,
    backoffMs = 5000,
    enabled = true,
  } = opts;
  const countRef = useRef(0);
  const stopRef = useRef(false);

  useEffect(() => {
    stopRef.current = !enabled;
    countRef.current = 0;

    async function loop() {
      if (stopRef.current) return;
      const cont = await tick();
      if (cont === false) return;
      countRef.current += 1;
      const delay = countRef.current >= backoffAfter ? backoffMs : intervalMs;
      setTimeout(loop, delay);
    }

    if (enabled) loop();
    return () => { stopRef.current = true; };
  }, [enabled, intervalMs, backoffAfter, backoffMs, tick]);
}
