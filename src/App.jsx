import { useState, useCallback } from 'react';
import './styles.css';

import { useGame } from './hooks/useGame';
import { PHASES } from './utils/game';

import HomeScreen from './components/HomeScreen';
import LobbyScreen from './components/LobbyScreen';
import NightScreen from './components/NightScreen';
import DayScreen from './components/DayScreen';
import VoteScreen from './components/VoteScreen';
import VoteResolveScreen from './components/VoteResolveScreen';
import EndScreen from './components/EndScreen';

export default function App() {
  const [session, setSession] = useState(null); // { code, playerId }

  const { room, me, players, alivePlayers, isHost, loading, error } = useGame(
    session?.code,
    session?.playerId
  );

  const handleEnterRoom = useCallback((result) => {
    setSession(result);
  }, []);

  const handleNewGame = useCallback(() => {
    setSession(null);
  }, []);

  // ── No session → home ──────────────────────────────────────────
  if (!session) {
    return (
      <div className="app">
        <HomeScreen onEnterRoom={handleEnterRoom} />
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="app">
        <div className="screen">
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="logo-icon" style={{ fontSize: '2.5rem' }}>🌕</div>
            <div className="waiting mt-2">
              Conectando <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────
  if (error || !room) {
    return (
      <div className="app">
        <div className="screen">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💀</div>
            <div className="error-text">{error || 'La sala no existe.'}</div>
            <div className="mt-2">
              <button className="btn btn-ghost" onClick={handleNewGame}>Volver al inicio</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const phase = room.phase;

  // ── Route by phase ─────────────────────────────────────────────
  const screenProps = { room, me, players, alivePlayers, isHost };

  const renderScreen = () => {
    switch (phase) {
      case PHASES.LOBBY:
        return <LobbyScreen {...screenProps} />;
      case PHASES.NIGHT:
        return <NightScreen {...screenProps} />;
      case PHASES.DAY:
        return <DayScreen {...screenProps} />;
      case PHASES.VOTE:
        return <VoteScreen {...screenProps} />;
      case PHASES.VOTE_RESOLVE:
        return <VoteResolveScreen {...screenProps} />;
      case PHASES.END:
        return <EndScreen {...screenProps} onNewGame={handleNewGame} />;
      default:
        return <div className="card"><div className="text-center">Fase desconocida: {phase}</div></div>;
    }
  };

  return (
    <div className="app">
      {renderScreen()}
    </div>
  );
}
