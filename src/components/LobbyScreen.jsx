import { startGame } from '../utils/actions';
import { ROLE_INFO, ROLES } from '../utils/game';

export default function LobbyScreen({ room, me, players, isHost }) {
  const { settings, code } = room;
  const ready = players.length === settings.playerCount;

  const handleStart = async () => {
    try { await startGame(code); } catch (e) { alert(e.message); }
  };

  const roleBreakdown = [
    { role: ROLES.LOBO, count: settings.wolfCount },
    { role: ROLES.CAZADOR, count: settings.hunterCount },
    { role: ROLES.ALQUIMISTA, count: settings.alchemistCount },
    {
      role: ROLES.FORASTERO,
      count: settings.playerCount - settings.wolfCount - settings.hunterCount - settings.alchemistCount
    },
  ].filter(r => r.count > 0);

  return (
    <div className="screen">
      <div className="logo" style={{ marginBottom: '1.5rem' }}>
        <span className="logo-icon" style={{ fontSize: '2rem' }}>🌕</span>
        <div className="logo-title" style={{ fontSize: '2.5rem' }}>WEREWOLF</div>
      </div>

      <div className="card">
        <div className="room-code">
          <div className="room-code-label">Código de sala</div>
          <div className="room-code-value">{code}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
            Compartí este código con los demás jugadores
          </div>
        </div>

        <div className="section-title">
          Jugadores ({players.length}/{settings.playerCount})
        </div>

        <div className="player-list">
          {players.map(p => (
            <div key={p.id} className={`player-item player-item--static ${p.id === me?.id ? 'player-item--me' : ''}`}>
              <div className="player-avatar">🧑</div>
              <span className="player-name">{p.name}</span>
              {p.isHost && <span className="player-badge player-badge--host">HOST</span>}
              {p.id === me?.id && !p.isHost && <span className="player-badge player-badge--you">TÚ</span>}
              {p.connected
                ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green-bright)', display: 'inline-block' }} />
                : <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-dim)', display: 'inline-block' }} />
              }
            </div>
          ))}
          {Array.from({ length: settings.playerCount - players.length }).map((_, i) => (
            <div key={`empty-${i}`} className="player-item player-item--static" style={{ opacity: 0.3 }}>
              <div className="player-avatar" style={{ border: '1px dashed var(--border)' }}>?</div>
              <span className="player-name" style={{ fontStyle: 'italic', color: 'var(--text-dim)' }}>Esperando jugador…</span>
            </div>
          ))}
        </div>

        <div className="section-title" style={{ marginTop: '1.5rem' }}>Roles en juego</div>
        <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
          {roleBreakdown.map(({ role, count }) => {
            const info = ROLE_INFO[role];
            return Array.from({ length: count }).map((_, i) => (
              <span key={`${role}-${i}`} className={`pill pill-${
                role === ROLES.LOBO ? 'red' :
                role === ROLES.CAZADOR ? 'green' :
                role === ROLES.ALQUIMISTA ? 'purple' : 'gold'
              }`}>
                {info.icon} {info.label}
              </span>
            ));
          })}
        </div>

        <div className="section-title" style={{ marginTop: '1.5rem' }}>Configuración</div>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-dim)', lineHeight: 1.8 }}>
          ⏱ Discusión: {settings.discussionTime > 0 ? `${settings.discussionTime / 60} min` : 'Sin límite'}<br />
          🗳 Votos: {settings.secretVotes ? 'Secretos' : 'Públicos'}<br />
          🎭 Revelar rol al morir: {settings.revealRole ? 'Sí' : 'No'}
        </div>

        {!ready && (
          <div className="waiting mt-2">
            Esperando jugadores <span className="dot" /><span className="dot" /><span className="dot" />
          </div>
        )}

        {isHost && ready && (
          <div className="mt-2">
            <button className="btn btn-primary" onClick={handleStart}>
              ⚔️ Comenzar el juego
            </button>
          </div>
        )}

        {!isHost && ready && (
          <div className="alert alert-info mt-2">
            Todos los jugadores están listos. Esperando que el host inicie el juego.
          </div>
        )}
      </div>
    </div>
  );
}
