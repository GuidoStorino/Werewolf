import { useState, useEffect, useCallback, useRef } from 'react';
import { subscribeRoom, setConnected } from '../utils/actions';

export function useGame(code, playerId) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!code || !playerId) return;

    const unsub = subscribeRoom(code, (data) => {
      if (!data) {
        setError('La sala ya no existe.');
        setRoom(null);
      } else {
        setRoom(data);
        setError(null);
      }
      setLoading(false);
    });

    // Mark connected
    setConnected(code, playerId, true).catch(() => {});

    // On unmount mark disconnected
    return () => {
      unsub();
      setConnected(code, playerId, false).catch(() => {});
    };
  }, [code, playerId]);

  const me = room?.players?.[playerId] || null;
  const players = room ? Object.values(room.players || {}) : [];
  const alivePlayers = players.filter(p => p.alive);
  const isHost = me?.isHost || false;

  return { room, me, players, alivePlayers, isHost, loading, error };
}
