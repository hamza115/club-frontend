import { useState, useEffect, useRef } from 'react';

/**
 * Calculates elapsed time for an active/paused session.
 * @param {object} session - Session object with startTime, status, pausedAt, totalPausedDuration
 * @returns {{ elapsed: number, formatted: string, isRunning: boolean }}
 */
export function useSessionTimer(session) {
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!session?.startTime) {
      setElapsed(0);
      return;
    }

    const start = new Date(session.startTime).getTime();
    const pausedDuration = session.totalPausedDuration || 0;

    if (session.status === 'paused' && session.pausedAt) {
      const effective = new Date(session.pausedAt).getTime() - start - pausedDuration;
      setElapsed(Math.max(0, effective));
      return;
    }

    if (session.status === 'completed') {
      const end = session.endTime ? new Date(session.endTime).getTime() : start;
      const ms = session.totalPlayingTime ?? Math.max(0, end - start - pausedDuration);
      setElapsed(ms);
      return;
    }

    if (session.status !== 'active') {
      setElapsed(session.totalPlayingTime || 0);
      return;
    }

    function tick() {
      const now = Date.now();
      const effective = now - start - pausedDuration;
      setElapsed(Math.max(0, effective));
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [session?.startTime, session?.status, session?.pausedAt, session?.totalPausedDuration, session?.totalPlayingTime, session?.endTime]);

  const totalSeconds = Math.floor(elapsed / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return { elapsed, formatted, isRunning: session?.status === 'active' };
}
