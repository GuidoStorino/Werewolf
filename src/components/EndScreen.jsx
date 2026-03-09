import { useState } from 'react';
import { resetRoom, deleteRoom } from '../utils/actions';
import { ROLE_INFO, WIN_REASON, ROLES } from '../utils/game';

export default function EndScreen({ room, me, players, isHost, onNewGame }) {
  const { winner, settings, code } = room;
  const isVillageWin = winner?.winner === 'village';

  const [newSettings, setNewSettings] = useState({ ...settings });
  const [loading, setLoading] = useState(false);

  const updateSetting = (key, val) =>
    setNewSettings(prev => ({ ...prev, [key]: val }));

  const handleReplay = async () => {
    const total = newSettings.wolfCount + newSettings.hunterCount + newSettings.alchemistCount;
    if (total >= newSettings.playerCount) {
      alert('Demasiados roles especiales para la cantidad de jugadores.');
      return;
    }
    setLoading(true);
    try {
      await resetRoom(code, newSettings);
    } catch (e) {
      alert(e.message);
      setLoading(false);
    }
  };

  const handleLeave = async () => {
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
            const aWolf = a.role === ROLES.LOBO;
            const bWolf = b.role === ROLES.LOBO;
            if (isVillageWin) return aWolf ? 1 : -1;
            return bWolf ? 1 : -1;
          }).map(p => {
            const info = ROLE_INFO[p.role];
            const isWinner = isVillageWin ? p.role !== ROLES.LOBO : p.role === ROLES.LOBO;
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

        {isHost && (
          <>
            <div className="divider" style={{ marginTop: '1.5rem' }}>Nueva partida</div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Total jugadores</label>
                <select className="form-select" value={newSettings.playerCount}
                  onChange={e => updateSetting('playerCount', +e.target.value)}>
                  {[4,5,6,7,8,9,10,12,15,20].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Lobos 🐺</label>
                <select className="form-select" value={newSettings.wolfCount}
                  onChange={e => updateSetting('wolfCount', +e.target.value)}>
                  {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cazadores 🏹</label>
                <select className="form-select" value={newSettings.hunterCount}
                  onChange={e => updateSetting('hunterCount', +e.target.value)}>
                  {[0,1,2].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Alquimistas ⚗️</label>
                <select className="form-select" value={newSettings.alchemistCount}
                  onChange={e => updateSetting('alchemistCount', +e.target.value)}>
                  {[0,1,2].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tiempo de discusión</label>
              <select className="form-select" value={newSettings.discussionTime}
                onChange={e => updateSetting('discussionTime', +e.target.value)}>
                <option value={60}>1 minuto</option>
                <option value={120}>2 minutos</option>
                <option value={180}>3 minutos</option>
                <option value={300}>5 minutos</option>
                <option value={600}>10 minutos</option>
                <option value={0}>Sin límite</option>
              </select>
            </div>

            <div className="toggle-row">
              <span className="toggle-label">Votos secretos</span>
              <label className="toggle">
                <input type="checkbox" checked={newSettings.secretVotes}
                  onChange={e => updateSetting('secretVotes', e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="toggle-row" style={{ marginBottom: '1rem' }}>
              <span className="toggle-label">Revelar rol al eliminar</span>
              <label className="toggle">
                <input type="checkbox" checked={newSettings.revealRole}
                  onChange={e => updateSetting('revealRole', e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <button className="btn btn-primary" onClick={handleReplay} disabled={loading}>
              {loading ? 'Reiniciando...' : '🌕 Volver a jugar'}
            </button>
          </>
        )}

        {!isHost && (
          <div className="alert alert-info mt-2">
            Esperando que el host inicie una nueva partida...
          </div>
        )}

        <div className="mt-1">
          <button className="btn btn-ghost" onClick={handleLeave}>
            Salir de la sala
          </button>
        </div>
      </div>
    </div>
  );
}