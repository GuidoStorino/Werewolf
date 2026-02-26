import { useState } from 'react';
import { submitVote, resolveVote } from '../utils/actions';
import { useCountdown } from '../hooks/useCountdown';
import { ROLE_INFO } from '../utils/game';

export default function VoteScreen({ room, me, players, alivePlayers, isHost }) {
  const [myVote, setMyVote] = useState(null);
  const [voteSubmitted, setVoteSubmitted] = useState(false);

  const { settings, votes, code } = room;
  const isAlive = me?.alive;

  const handleVote = async (targetId) => {
    if (!isAlive || voteSubmitted) return;
    setMyVote(targetId);
    try {
      await submitVote(code, me.id, targetId);
      setVoteSubmitted(true);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleResolve = async () => {
    try { await resolveVote(code); } catch (e) { alert(e.message); }
  };

  // Count votes for display
  const voteCounts = {};
  Object.values(votes || {}).forEach(targetId => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });
  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);
  const aliveCount = alivePlayers.length;
  const submittedCount = Object.keys(votes || {}).filter(vid =>
    alivePlayers.some(p => p.id === vid)
  ).length;

  const allVoted = submittedCount >= aliveCount;

  return (
    <div className="screen">
      <div className="card">
        <div className="phase-header">
          <span className="phase-icon">🗳</span>
          <div className="phase-title">Votación</div>
          <div className="phase-sub">¿Quién es el hombre lobo?</div>
        </div>

        {!isAlive && (
          <div className="alert alert-danger mb-2">Estás muerto. Solo podés observar.</div>
        )}

        {isAlive && !voteSubmitted && (
          <>
            <div className="section-title">Votá para eliminar</div>
            <div className="player-list">
              {alivePlayers
                .filter(p => p.id !== me?.id)
                .map(p => {
                  const count = voteCounts[p.id] || 0;
                  return (
                    <div
                      key={p.id}
                      className={`player-item ${myVote === p.id ? 'player-item--selected' : ''}`}
                      onClick={() => handleVote(p.id)}
                    >
                      <div className="player-avatar">🧑</div>
                      <span className="player-name">{p.name}</span>
                      {!settings.secretVotes && count > 0 && (
                        <span className="pill pill-red">{count} voto{count !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  );
                })}
            </div>
          </>
        )}

        {isAlive && voteSubmitted && (
          <div className="alert alert-success">
            ✓ Votaste por <strong>{players.find(p => p.id === myVote)?.name}</strong>.
          </div>
        )}

        {/* Vote progress */}
        <div className="section-title" style={{ marginTop: '1.2rem' }}>
          Progreso ({submittedCount}/{aliveCount} votos)
        </div>
        <div className="vote-bar">
          <div className="vote-bar-fill" style={{ width: `${aliveCount > 0 ? (submittedCount / aliveCount) * 100 : 0}%` }} />
        </div>

        {/* Public vote tally */}
        {!settings.secretVotes && Object.entries(voteCounts).length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            {alivePlayers
              .filter(p => voteCounts[p.id])
              .sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0))
              .map(p => {
                const count = voteCounts[p.id] || 0;
                return (
                  <div key={p.id}>
                    <div className="vote-tally">
                      <span>{p.name}</span>
                      <span>{count} voto{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="vote-bar" style={{ marginBottom: '0.5rem' }}>
                      <div className="vote-bar-fill"
                        style={{ width: `${totalVotes > 0 ? (count / totalVotes) * 100 : 0}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {settings.secretVotes && (
          <div className="alert alert-info mt-1">
            Los votos son secretos. Se revelarán al resolver.
          </div>
        )}

        {/* Host controls */}
        {isHost && (
          <div className="mt-2">
            <button
              className={`btn ${allVoted ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleResolve}
            >
              ⚖️ Resolver votación
            </button>
          </div>
        )}

        {!isHost && allVoted && (
          <div className="waiting mt-2">
            Todos votaron. Esperando al host <span className="dot" /><span className="dot" /><span className="dot" />
          </div>
        )}

        <div className="text-center mt-2" style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          Ronda {room.round}
        </div>
      </div>
    </div>
  );
}
