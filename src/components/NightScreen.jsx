import { useState, useEffect } from 'react';
import {
  submitWolfTarget, submitAlchemistPotion,
  submitHunterSpy, advanceNightStep, resolveNight
} from '../utils/actions';
import { ROLES, ROLE_INFO, NIGHT_STEPS } from '../utils/game';

export default function NightScreen({ room, me, players, alivePlayers, isHost }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [spiedRole, setSpiedRole] = useState(null);
  const [error, setError] = useState('');

  const nightStep = room.nightStep;
  const nightActions = room.nightActions || {};

  const isWolf = me?.role === ROLES.LOBO;
  const isAlchemist = me?.role === ROLES.ALQUIMISTA;
  const isHunter = me?.role === ROLES.CAZADOR;
  const isAlive = me?.alive;

  // Lobos vivos para coordinarse
  const aliveWolves = players.filter(p => p.role === ROLES.LOBO && p.alive);
  // Otras víctimas potenciales (no lobos, vivos)
  const wolfTargets = alivePlayers.filter(p => p.role !== ROLES.LOBO);
  // Alquimista puede darse a sí mismo o a cualquier vivo
  const alchemistTargets = alivePlayers;
  // Cazador puede espiar a cualquier vivo excepto a sí mismo
  const hunterTargets = alivePlayers.filter(p => p.id !== me?.id);

  // ── Is my action needed in this step? ─────────────────────────

  const iMyStep =
    (nightStep === NIGHT_STEPS.WOLVES && isWolf && isAlive) ||
    (nightStep === NIGHT_STEPS.ALCHEMIST && isAlchemist && isAlive) ||
    (nightStep === NIGHT_STEPS.HUNTER && isHunter && isAlive);

  // Wolf already chose?
  const wolfDone = !!nightActions.wolfTarget;
  // Alchemist done?
  const alchemistDone = nightActions.alchemistTarget !== undefined;
  // Hunter done?
  const hunterDone = !!nightActions.hunterSpied;

  // Check if host can advance step
  const canAdvanceWolves = nightStep === NIGHT_STEPS.WOLVES && wolfDone;
  const canAdvanceAlchemist = nightStep === NIGHT_STEPS.ALCHEMIST && alchemistDone;
  const canAdvanceHunter = nightStep === NIGHT_STEPS.HUNTER && hunterDone;
  const canResolve = nightStep === NIGHT_STEPS.DONE;

  const handleSubmit = async () => {
    if (!selected && nightStep !== NIGHT_STEPS.ALCHEMIST) return;
    setError('');
    try {
      if (nightStep === NIGHT_STEPS.WOLVES) {
        await submitWolfTarget(room.code, selected);
        setSubmitted(true);
      } else if (nightStep === NIGHT_STEPS.ALCHEMIST) {
        await submitAlchemistPotion(room.code, selected);
        setSubmitted(true);
      } else if (nightStep === NIGHT_STEPS.HUNTER) {
        await submitHunterSpy(room.code, selected, me.id);
        const target = players.find(p => p.id === selected);
        const role = ROLE_INFO[target?.role]?.label || '?';
        setSpiedRole({ name: target?.name, role, icon: ROLE_INFO[target?.role]?.icon });
        setSubmitted(true);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const handleAdvance = async () => {
    if (nightStep === NIGHT_STEPS.WOLVES) await advanceNightStep(room.code, NIGHT_STEPS.ALCHEMIST);
    else if (nightStep === NIGHT_STEPS.ALCHEMIST) await advanceNightStep(room.code, NIGHT_STEPS.HUNTER);
    else if (nightStep === NIGHT_STEPS.HUNTER) await advanceNightStep(room.code, NIGHT_STEPS.DONE);
    else if (nightStep === NIGHT_STEPS.DONE) await resolveNight(room.code);
  };

  // ── Labels per step ────────────────────────────────────────────

  const stepLabels = {
    [NIGHT_STEPS.WOLVES]: { title: 'Los lobos despiertan', icon: '🐺', sub: 'Los lobos están eligiendo a su víctima' },
    [NIGHT_STEPS.ALCHEMIST]: { title: 'El alquimista trabaja', icon: '⚗️', sub: 'El alquimista prepara su poción' },
    [NIGHT_STEPS.HUNTER]: { title: 'El cazador observa', icon: '🏹', sub: 'El cazador investiga en la oscuridad' },
    [NIGHT_STEPS.DONE]: { title: 'La noche termina', icon: '🌑', sub: 'Todos han actuado. El destino se revela...' },
  };

  const current = stepLabels[nightStep] || stepLabels[NIGHT_STEPS.WOLVES];

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="screen">
      <div className="card">
        <div className="phase-header">
          <span className="phase-icon">{current.icon}</span>
          <div className="phase-title">{current.title}</div>
          <div className="phase-sub">{current.sub}</div>
        </div>

        {/* My role reminder */}
        {me && (
          <div className={`role-card role-card--${me.role}`} style={{ marginBottom: '1rem' }}>
            <span className="role-icon">{ROLE_INFO[me.role]?.icon}</span>
            <div className="role-title">{ROLE_INFO[me.role]?.label}</div>
          </div>
        )}

        {/* ── WOLVES step ── */}
        {nightStep === NIGHT_STEPS.WOLVES && (
          <>
            {isWolf && isAlive && !submitted && (
              <>
                <div className="section-title">Elegí tu víctima</div>
                {aliveWolves.length > 1 && (
                  <div className="alert alert-danger mb-1">
                    Coordínense entre todos los lobos. El último voto enviado cuenta.
                  </div>
                )}
                <div className="player-list">
                  {wolfTargets.map(p => (
                    <div
                      key={p.id}
                      className={`player-item ${selected === p.id ? 'player-item--selected' : ''}`}
                      onClick={() => setSelected(p.id)}
                    >
                      <div className="player-avatar">🧑</div>
                      <span className="player-name">{p.name}</span>
                    </div>
                  ))}
                </div>
                {error && <div className="error-text mt-1">{error}</div>}
                <div className="mt-2">
                  <button className="btn btn-danger" onClick={handleSubmit} disabled={!selected}>
                    Atacar a {selected ? players.find(p => p.id === selected)?.name : '...'}
                  </button>
                </div>
              </>
            )}

            {isWolf && isAlive && submitted && (
              <div className="alert alert-danger">
                ✓ Elegiste a <strong>{players.find(p => p.id === selected)?.name}</strong>.
                {nightActions.wolfTarget &&
                  <span> El objetivo actual del grupo: <strong>{players.find(p => p.id === nightActions.wolfTarget)?.name}</strong></span>
                }
              </div>
            )}

            {!isWolf && (
              <div className="alert alert-info">
                <div className="waiting">
                  Los lobos están actuando <span className="dot" /><span className="dot" /><span className="dot" />
                </div>
              </div>
            )}

            {isWolf && !isAlive && (
              <div className="alert alert-danger">Estás muerto. Solo podés observar.</div>
            )}
          </>
        )}

        {/* ── ALCHEMIST step ── */}
        {nightStep === NIGHT_STEPS.ALCHEMIST && (
          <>
            {isAlchemist && isAlive && !submitted && (
              <>
                <div className="alert alert-purple mb-1">
                  Preparaste una poción de vida. Si el jugador que la recibe es atacado esta noche, se salvará.
                  {!room.players?.[me.id]?.usedPotionOnSelf &&
                    ' Podés dartela a ti mismo una vez.'}
                </div>
                <div className="section-title">¿A quién le das la poción?</div>
                <div className="player-list">
                  {alchemistTargets.map(p => (
                    <div
                      key={p.id}
                      className={`player-item ${selected === p.id ? 'player-item--selected' : ''}`}
                      onClick={() => setSelected(p.id)}
                    >
                      <div className="player-avatar">{p.id === me.id ? '⚗️' : '🧑'}</div>
                      <span className="player-name">{p.name} {p.id === me.id ? '(Tú)' : ''}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <button className="btn btn-primary" onClick={handleSubmit} disabled={!selected}
                    style={{ background: 'var(--purple-bright)', borderColor: 'var(--purple-bright)' }}>
                    Dar poción a {selected ? players.find(p => p.id === selected)?.name : '...'}
                  </button>
                </div>
              </>
            )}
            {isAlchemist && isAlive && submitted && (
              <div className="alert alert-purple">
                ✓ Diste la poción a <strong>{players.find(p => p.id === selected)?.name}</strong>.
                Si es atacado esta noche, se salvará.
              </div>
            )}
            {!isAlchemist && (
              <div className="alert alert-info">
                <div className="waiting">
                  El alquimista está actuando <span className="dot" /><span className="dot" /><span className="dot" />
                </div>
              </div>
            )}
          </>
        )}

        {/* ── HUNTER step ── */}
        {nightStep === NIGHT_STEPS.HUNTER && (
          <>
            {isHunter && isAlive && !submitted && (
              <>
                <div className="alert alert-success mb-1">
                  Podés espiar el rol secreto de un jugador.
                </div>
                <div className="section-title">¿A quién espías?</div>
                <div className="player-list">
                  {hunterTargets.map(p => (
                    <div
                      key={p.id}
                      className={`player-item ${selected === p.id ? 'player-item--selected' : ''}`}
                      onClick={() => setSelected(p.id)}
                    >
                      <div className="player-avatar">🧑</div>
                      <span className="player-name">{p.name}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <button className="btn btn-primary" onClick={handleSubmit} disabled={!selected}
                    style={{ background: 'var(--green-bright)', borderColor: 'var(--green-bright)' }}>
                    Espiar a {selected ? players.find(p => p.id === selected)?.name : '...'}
                  </button>
                </div>
              </>
            )}
            {isHunter && isAlive && submitted && spiedRole && (
              <div className="alert alert-success">
                🔍 <strong>{spiedRole.name}</strong> es {spiedRole.icon} <strong>{spiedRole.role}</strong>
              </div>
            )}
            {!isHunter && (
              <div className="alert alert-info">
                <div className="waiting">
                  El cazador está investigando <span className="dot" /><span className="dot" /><span className="dot" />
                </div>
              </div>
            )}
          </>
        )}

        {/* ── DONE step ── */}
        {nightStep === NIGHT_STEPS.DONE && (
          <div className="alert alert-info">
            <div className="waiting">
              La noche concluye <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}

        {/* ── Host controls ── */}
        {isHost && (
          <div className="mt-2">
            {(canAdvanceWolves || canAdvanceAlchemist || canAdvanceHunter || canResolve) && (
              <button className="btn btn-secondary" onClick={handleAdvance}>
                {canResolve ? '🌅 Revelar resultado de la noche' : '▶ Continuar al siguiente paso'}
              </button>
            )}
          </div>
        )}

        {/* ── Round info ── */}
        <div className="text-center mt-2" style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          Ronda {room.round} · Quedan {alivePlayers.length} jugadores vivos
        </div>
      </div>
    </div>
  );
}
