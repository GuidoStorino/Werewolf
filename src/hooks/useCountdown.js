import { useState, useEffect, useRef } from 'react';

export function useCountdown(targetTimestamp, totalSeconds) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!targetTimestamp || !totalSeconds) { setTimeLeft(null); return; }

    const endTime = targetTimestamp + totalSeconds * 1000;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.round((endTime - now) / 1000));
      setTimeLeft(remaining);
    };

    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [targetTimestamp, totalSeconds]);

  return timeLeft;
}
