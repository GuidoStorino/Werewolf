import { useEffect } from 'react';
import { ROLE_INFO } from '../utils/game';

// This screen auto-shows the vote result before transitioning to night
export default function VoteResolveScreen({ room, players }) {
  const { lastVoteResult, settings } = room;
  const eliminated = lastVoteResult?.eliminated;
  const eliminatedPlayer = eliminated ? players.find(p => p.id === eliminated) : null;

  return (
    <div className="screen">
      <div className="card">
        <div className="phase-header">
          <span className="phase-icon">⚖️</span>
          <div className="phase-title">Resultado de la votación</div>
        </div>

        {eliminatedPlayer ? (
          <>
            <div className="alert alert-danger" style={{ textAlign: 'center', fontSize: '1.1rem' }}>
              💀 <strong>{eliminatedPlayer.name}</strong> ha sido eliminado por el pueblo.
              {settings.revealRole && eliminatedPlayer.role && (
                <div style={{ marginTop: '0.3rem', fontSize: '0.9rem' }}>
                  Era {ROLE_INFO[eliminatedPlayer.role]?.icon} <strong>{ROLE_INFO[eliminatedPlayer.role]?.label}</strong>.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="alert alert-info" style={{ textAlign: 'center' }}>
            🤝 Empate en los votos. Nadie fue eliminado.
          </div>
        )}

        <div className="waiting mt-2">
          Volviendo a la noche <span className="dot" /><span className="dot" /><span className="dot" />
        </div>
      </div>
    </div>
  );
}
