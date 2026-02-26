import { useState } from 'react';
import { createRoom, joinRoom } from '../utils/actions';

export default function HomeScreen({ onEnterRoom }) {
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Create room settings
  const [settings, setSettings] = useState({
    playerCount: 6,
    wolfCount: 1,
    hunterCount: 1,
    alchemistCount: 1,
    discussionTime: 120,
    secretVotes: false,
    revealRole: true,
  });

  const updateSetting = (key, val) =>
    setSettings(prev => ({ ...prev, [key]: val }));

  const handleCreate = async () => {
    if (!name.trim()) return setError('Ingresá tu nombre.');
    const total = settings.wolfCount + settings.hunterCount + settings.alchemistCount;
    if (total >= settings.playerCount) return setError('Demasiados roles especiales para la cantidad de jugadores.');
    if (settings.wolfCount < 1) return setError('Debe haber al menos 1 lobo.');
    setError('');
    setLoading(true);
    try {
      const result = await createRoom(name.trim(), settings);
      onEnterRoom(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) return setError('Ingresá tu nombre.');
    if (!joinCode.trim()) return setError('Ingresá el código de sala.');
    setError('');
    setLoading(true);
    try {
      const result = await joinRoom(joinCode.trim().toUpperCase(), name.trim());
      onEnterRoom(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen">
      <div className="logo">
        <span className="logo-icon">🌕</span>
        <div className="logo-title">WEREWOLF</div>
        <div className="logo-subtitle">el juego de los hombres lobo</div>
      </div>

      <div className="card">
        {/* Tabs */}
        <div className="flex gap-1 mb-2">
          <button
            className={`btn btn-sm ${tab === 'create' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
            onClick={() => setTab('create')}
          >CREAR SALA</button>
          <button
            className={`btn btn-sm ${tab === 'join' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
            onClick={() => setTab('join')}
          >UNIRSE</button>
        </div>

        {/* Name always required */}
        <div className="form-group">
          <label className="form-label">Tu nombre</label>
          <input
            className="form-input"
            placeholder="¿Cómo te llaman?"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
          />
        </div>

        {tab === 'join' ? (
          <>
            <div className="form-group">
              <label className="form-label">Código de sala</label>
              <input
                className="form-input"
                placeholder="ABC123"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                style={{ letterSpacing: '0.3em', fontSize: '1.3rem', fontFamily: 'Cinzel, serif', textAlign: 'center' }}
              />
            </div>
            {error && <div className="error-text">{error}</div>}
            <div className="mt-2">
              <button className="btn btn-primary" onClick={handleJoin} disabled={loading}>
                {loading ? 'Uniéndose...' : 'Entrar a la sala'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="divider">Jugadores</div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Total de jugadores</label>
                <select className="form-select" value={settings.playerCount}
                  onChange={e => updateSetting('playerCount', +e.target.value)}>
                  {[4,5,6,7,8,9,10,12,15,20].map(n => (
                    <option key={n} value={n}>{n} jugadores</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Lobos 🐺</label>
                <select className="form-select" value={settings.wolfCount}
                  onChange={e => updateSetting('wolfCount', +e.target.value)}>
                  {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cazadores 🏹</label>
                <select className="form-select" value={settings.hunterCount}
                  onChange={e => updateSetting('hunterCount', +e.target.value)}>
                  {[0,1,2].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Alquimistas ⚗️</label>
                <select className="form-select" value={settings.alchemistCount}
                  onChange={e => updateSetting('alchemistCount', +e.target.value)}>
                  {[0,1,2].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tiempo de discusión</label>
              <select className="form-select" value={settings.discussionTime}
                onChange={e => updateSetting('discussionTime', +e.target.value)}>
                <option value={60}>1 minuto</option>
                <option value={120}>2 minutos</option>
                <option value={180}>3 minutos</option>
                <option value={300}>5 minutos</option>
                <option value={600}>10 minutos</option>
                <option value={0}>Sin límite</option>
              </select>
            </div>

            <div className="divider">Opciones</div>

            <div className="toggle-row">
              <span className="toggle-label">Votos secretos</span>
              <label className="toggle">
                <input type="checkbox" checked={settings.secretVotes}
                  onChange={e => updateSetting('secretVotes', e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="toggle-row">
              <span className="toggle-label">Revelar rol al eliminar</span>
              <label className="toggle">
                <input type="checkbox" checked={settings.revealRole}
                  onChange={e => updateSetting('revealRole', e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {error && <div className="error-text mt-1">{error}</div>}
            <div className="mt-2">
              <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
                {loading ? 'Creando sala...' : 'Crear sala'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
