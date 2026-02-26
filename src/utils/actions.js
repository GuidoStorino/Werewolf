import { db } from '../firebase';
import {
  ref, set, update, get, onValue, off, serverTimestamp, remove
} from 'firebase/database';
import {
  generateRoomCode, assignRoles, checkWinCondition,
  PHASES, NIGHT_STEPS, ROLES
} from './game';

// ─── Room Creation ──────────────────────────────────────────────────────────

export async function createRoom(hostName, settings) {
  const code = generateRoomCode();
  const hostId = `host_${Math.random().toString(36).substring(2, 10)}`;

  const roomData = {
    code,
    hostId,
    phase: PHASES.LOBBY,
    settings: {
      playerCount: settings.playerCount,
      wolfCount: settings.wolfCount,
      hunterCount: settings.hunterCount,
      alchemistCount: settings.alchemistCount,
      discussionTime: settings.discussionTime, // seconds
      secretVotes: settings.secretVotes,
      revealRole: settings.revealRole,
    },
    players: {
      [hostId]: {
        id: hostId,
        name: hostName,
        isHost: true,
        alive: true,
        connected: true,
        joinedAt: Date.now(),
      }
    },
    nightActions: {},
    votes: {},
    roundLog: [],
    round: 0,
    createdAt: Date.now(),
  };

  await set(ref(db, `rooms/${code}`), roomData);
  return { code, playerId: hostId };
}

// ─── Join Room ───────────────────────────────────────────────────────────────

export async function joinRoom(code, playerName) {
  const roomRef = ref(db, `rooms/${code}`);
  const snap = await get(roomRef);

  if (!snap.exists()) throw new Error('La sala no existe.');

  const room = snap.val();
  if (room.phase !== PHASES.LOBBY) throw new Error('El juego ya comenzó.');

  const players = room.players || {};
  const count = Object.keys(players).length;
  if (count >= room.settings.playerCount) throw new Error('La sala está llena.');

  const playerId = `p_${Math.random().toString(36).substring(2, 10)}`;

  await update(ref(db, `rooms/${code}/players/${playerId}`), {
    id: playerId,
    name: playerName,
    isHost: false,
    alive: true,
    connected: true,
    joinedAt: Date.now(),
  });

  return { code, playerId };
}

// ─── Start Game ──────────────────────────────────────────────────────────────

export async function startGame(code) {
  const snap = await get(ref(db, `rooms/${code}`));
  const room = snap.val();
  const players = Object.values(room.players);
  const settings = room.settings;

  const roles = assignRoles(players, settings);

  const updates = {};
  players.forEach((p, i) => {
    updates[`rooms/${code}/players/${p.id}/role`] = roles[i];
  });

  updates[`rooms/${code}/phase`] = PHASES.NIGHT;
  updates[`rooms/${code}/round`] = 1;
  updates[`rooms/${code}/nightStep`] = NIGHT_STEPS.WOLVES;
  updates[`rooms/${code}/nightActions`] = {};
  updates[`rooms/${code}/votes`] = {};
  updates[`rooms/${code}/nightPhaseStart`] = Date.now();

  await update(ref(db), updates);
}

// ─── Night Actions ────────────────────────────────────────────────────────────

export async function submitWolfTarget(code, targetId) {
  await update(ref(db, `rooms/${code}/nightActions`), { wolfTarget: targetId });
}

export async function submitAlchemistPotion(code, targetId) {
  await update(ref(db, `rooms/${code}/nightActions`), { alchemistTarget: targetId });
}

export async function submitHunterSpy(code, targetId, hunterSelfId) {
  // Hunter's result is stored privately under their id
  const snap = await get(ref(db, `rooms/${code}/players/${targetId}/role`));
  const role = snap.val();
  const updates = {};
  updates[`rooms/${code}/nightActions/hunterSpied`] = targetId;
  updates[`rooms/${code}/players/${hunterSelfId}/spiedResult`] = {
    playerId: targetId,
    role: role,
  };
  await update(ref(db), updates);
}

// ─── Resolve Night ────────────────────────────────────────────────────────────

export async function resolveNight(code) {
  const snap = await get(ref(db, `rooms/${code}`));
  const room = snap.val();
  const { nightActions, players } = room;

  const wolfTarget = nightActions?.wolfTarget || null;
  const alchemistTarget = nightActions?.alchemistTarget || null;

  const updates = {};
  let killed = null;
  let saved = false;

  if (wolfTarget) {
    if (alchemistTarget && alchemistTarget === wolfTarget) {
      saved = true;
    } else {
      killed = wolfTarget;
      updates[`rooms/${code}/players/${wolfTarget}/alive`] = false;
    }
  }

  // Build log entry
  const logEntry = {
    round: room.round,
    phase: 'night',
    killed: killed,
    saved: saved,
    savedPlayerId: saved ? wolfTarget : null,
    timestamp: Date.now(),
  };

  const logKey = `round${room.round}_night`;
  updates[`rooms/${code}/roundLog/${logKey}`] = logEntry;
  updates[`rooms/${code}/lastNightResult`] = logEntry;
  updates[`rooms/${code}/nightActions`] = {};
  updates[`rooms/${code}/votes`] = {};

  // Check win after night
  const updatedPlayers = { ...players };
  if (killed) updatedPlayers[killed] = { ...updatedPlayers[killed], alive: false };
  const win = checkWinCondition(updatedPlayers);

  if (win) {
    updates[`rooms/${code}/phase`] = PHASES.END;
    updates[`rooms/${code}/winner`] = win;
  } else {
    updates[`rooms/${code}/phase`] = PHASES.DAY;
    updates[`rooms/${code}/dayPhaseStart`] = Date.now();
  }

  await update(ref(db), updates);
}

// ─── Advance to Vote ─────────────────────────────────────────────────────────

export async function startVotePhase(code) {
  await update(ref(db, `rooms/${code}`), {
    phase: PHASES.VOTE,
    votePhaseStart: Date.now(),
    votes: {},
  });
}

// ─── Submit Vote ─────────────────────────────────────────────────────────────

export async function submitVote(code, voterId, targetId) {
  await set(ref(db, `rooms/${code}/votes/${voterId}`), targetId);
}

// ─── Resolve Vote ─────────────────────────────────────────────────────────────

export async function resolveVote(code) {
  const snap = await get(ref(db, `rooms/${code}`));
  const room = snap.val();
  const { votes, players, round } = room;

  // Count votes only among alive players
  const voteCounts = {};
  const aliveIds = Object.values(players).filter(p => p.alive).map(p => p.id);

  Object.entries(votes || {}).forEach(([voter, target]) => {
    if (aliveIds.includes(voter) && aliveIds.includes(target)) {
      voteCounts[target] = (voteCounts[target] || 0) + 1;
    }
  });

  // Find max votes
  let maxVotes = 0;
  let eliminated = null;
  Object.entries(voteCounts).forEach(([pid, count]) => {
    if (count > maxVotes) { maxVotes = count; eliminated = pid; }
  });

  // Tie → no elimination
  const maxCount = Object.values(voteCounts).filter(c => c === maxVotes).length;
  if (maxCount > 1) eliminated = null;

  const updates = {};
  if (eliminated) {
    updates[`rooms/${code}/players/${eliminated}/alive`] = false;
  }

  const logEntry = {
    round,
    phase: 'day',
    eliminated,
    voteCounts,
    timestamp: Date.now(),
  };
  updates[`rooms/${code}/roundLog/round${round}_day`] = logEntry;
  updates[`rooms/${code}/lastVoteResult`] = logEntry;

  const updatedPlayers = { ...players };
  if (eliminated) updatedPlayers[eliminated] = { ...updatedPlayers[eliminated], alive: false };

  const win = checkWinCondition(updatedPlayers);

  if (win) {
    updates[`rooms/${code}/phase`] = PHASES.END;
    updates[`rooms/${code}/winner`] = win;
  } else {
    updates[`rooms/${code}/phase`] = PHASES.NIGHT;
    updates[`rooms/${code}/round`] = round + 1;
    updates[`rooms/${code}/nightStep`] = NIGHT_STEPS.WOLVES;
    updates[`rooms/${code}/nightActions`] = {};
    updates[`rooms/${code}/votes`] = {};
    updates[`rooms/${code}/nightPhaseStart`] = Date.now();
  }

  await update(ref(db), updates);
}

// ─── Night Step Advancement ───────────────────────────────────────────────────

export async function advanceNightStep(code, nextStep) {
  await update(ref(db, `rooms/${code}`), { nightStep: nextStep });
}

// ─── Subscribe helpers ────────────────────────────────────────────────────────

export function subscribeRoom(code, callback) {
  const roomRef = ref(db, `rooms/${code}`);
  onValue(roomRef, (snap) => callback(snap.val()));
  return () => off(roomRef);
}

export async function deleteRoom(code) {
  await remove(ref(db, `rooms/${code}`));
}

export async function setConnected(code, playerId, connected) {
  await update(ref(db, `rooms/${code}/players/${playerId}`), { connected });
}
