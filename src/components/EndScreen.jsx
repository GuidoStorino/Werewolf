import { deleteRoom } from '../utils/actions';
import { ROLE_INFO, WIN_REASON, ROLES } from '../utils/game';

export default function EndScreen({ room, me, players, isHost, onNewGame }) {
  const { winner, settings, code } = room;
  const isVillageWin = winner?.winner === 'village';

  const handleNewGame = async () => {
    if (isHost) {
      try { await deleteRoom(code); } catch (_) {}
    }
    onNewGame();
  };

  return (
    <div className="screen">
      <div className="card">
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '0.5rem' }}>
            {isVillageWin ? '🏆' : '🐺'}
          </span>
          <div className="logo-title" style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>
            {isVillageWin ? '¡El pueblo gana!' : '¡Los lobos ganan!'}
          </div>
          <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '1rem' }}>
            {winner?.reason === WIN_REASON.WOLVES_DEAD
              ? 'Todos los hombres lobo han sido eliminados.'
              : 'Los lobos superaron en número a los aldeanos.'}
          </div>
        </div>

        <div className="section-title" style={{ marginTop: '1.5rem' }}>Resultados finales</div>
        <div className="player-list">
          {players.sort((a, b) => {
            // Wolves first if wolves win, villagers first if village wins
            const aWolf = a.role === ROLES.LOBO;
            const bWolf = b.role === ROLES.LOBO;
            if (isVillageWin) return aWolf ? 1 : -1;
            return bWolf ? 1 : -1;
          }).map(p => {
            const info = ROLE_INFO[p.role];
            const isWinner = isVillageWin
              ? p.role !== ROLES.LOBO
              : p.role === ROLES.LOBO;
            return (
              <div key={p.id} className={`player-item player-item--static ${!p.alive ? 'player-item--dead' : ''}`}>
                <div className="player-avatar">{info?.icon || '🧑'}</div>
                <span className="player-name">{p.name}</span>
                <span className={`pill ${
                  p.role === ROLES.LOBO ? 'pill-red' :
                  p.role === ROLES.CAZADOR ? 'pill-green' :
                  p.role === ROLES.ALQUIMISTA ? 'pill-purple' : 'pill-gold'
                }`}>{info?.label}</span>
                {isWinner && p.alive && <span>🏆</span>}
                {!p.alive && <span>💀</span>}
              </div>
            );
          })}
        </div>

        <div className="mt-2">
          <button className="btn btn-primary" onClick={handleNewGame}>
            🌕 Nueva partida
          </button>
        </div>
      </div>
    </div>
  );
}
