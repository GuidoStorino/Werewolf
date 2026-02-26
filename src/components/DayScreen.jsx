import { startVotePhase } from '../utils/actions';
import { useCountdown } from '../hooks/useCountdown';
import { ROLE_INFO, ROLES } from '../utils/game';

export default function DayScreen({ room, me, players, alivePlayers, isHost }) {
  const { lastNightResult, settings, code } = room;

  const killed = lastNightResult?.killed;
  const saved = lastNightResult?.saved;
  const savedPlayerId = lastNightResult?.savedPlayerId;

  const killedPlayer = killed ? players.find(p => p.id === killed) : null;
  const savedPlayer = savedPlayerId ? players.find(p => p.id === savedPlayerId) : null;

  const discussionTime = settings?.discussionTime > 0 ? settings.discussionTime : null;
  const timeLeft = useCountdown(room.dayPhaseStart, discussionTime);

  const handleStartVote = async () => {
    try { await startVotePhase(code); } catch (e) { alert(e.message); }
  };

  const timerDone = discussionTime && timeLeft === 0;

  return (
    <div className="screen">
      <div className="card">
        <div className="phase-header">
          <span className="phase-icon">🌄</span>
          <div className="phase-title">Amanece</div>
          <div className="phase-sub">La noche ha revelado sus secretos</div>
        </div>

        {/* Night result announcement */}
        {killed && killedPlayer && (
          <div className="alert alert-danger">
            💀 <strong>{killedPlayer.name}</strong> fue asesinado durante la noche.
            {settings.revealRole && killedPlayer.role && (
              <span> Era {ROLE_INFO[killedPlayer.role]?.icon} <strong>{ROLE_INFO[killedPlayer.role]?.label}</strong>.</span>
            )}
          </div>
        )}

        {saved && savedPlayer && (
          <div className="alert alert-success">
            ✨ La poción del alquimista salvó a alguien esta noche.
          </div>
        )}

        {!killed && !saved && (
          <div className="alert alert-info">
            😮 Esta noche no murió nadie. El pueblo descansó en paz.
          </div>
        )}

        {saved && killed && (
          <div className="alert alert-success">
            ⚗️ La poción del alquimista salvó a <strong>{savedPlayer?.name}</strong>, quien había sido atacado por los lobos.
          </div>
        )}

        {/* Discussion phase */}
        <div className="section-title" style={{ marginTop: '1.2rem' }}>Jugadores vivos</div>
        <div className="player-list">
          {players.map(p => (
            <div key={p.id} className={`player-item player-item--static ${!p.alive ? 'player-item--dead' : ''} ${p.id === me?.id ? 'player-item--me' : ''}`}>
              <div className="player-avatar">{p.alive ? '🧑' : '💀'}</div>
              <span className="player-name">{p.name}</span>
              {!p.alive && settings.revealRole && p.role && (
                <span>{ROLE_INFO[p.role]?.icon}</span>
              )}
              {p.id === me?.id && <span className="player-badge player-badge--you">TÚ</span>}
              {!p.alive && <span className="player-badge player-badge--dead">MUERTO</span>}
            </div>
          ))}
        </div>

        {/* Timer */}
        {discussionTime && (
          <div className="timer mt-2">
            <div className={`timer-value ${timeLeft !== null && timeLeft <= 10 ? 'timer-value--urgent' : ''}`}>
              {timeLeft !== null ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}` : '--:--'}
            </div>
            <div className="timer-label">tiempo de discusión</div>
          </div>
        )}

        {!discussionTime && (
          <div className="alert alert-info mt-2" style={{ textAlign: 'center' }}>
            💬 Discutan entre todos quién podría ser el hombre lobo.
          </div>
        )}

        {/* Host control */}
        {isHost && (
          <div className="mt-2">
            <button
              className={`btn ${timerDone ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleStartVote}
            >
              🗳 Iniciar votación
            </button>
          </div>
        )}

        {!isHost && (
          <div className="waiting mt-2">
            El host iniciará la votación <span className="dot" /><span className="dot" /><span className="dot" />
          </div>
        )}

        <div className="text-center mt-2" style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          Ronda {room.round} · {alivePlayers.length} jugadores vivos
        </div>
      </div>
    </div>
  );
}
