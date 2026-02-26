export const ROLES = {
  FORASTERO: 'forastero',
  LOBO: 'lobo',
  CAZADOR: 'cazador',
  ALQUIMISTA: 'alquimista',
};

export const ROLE_INFO = {
  [ROLES.FORASTERO]: {
    label: 'Forastero',
    description: 'Eres un aldeano inocente. Trabaja con el pueblo para descubrir a los lobos.',
    icon: '🧑‍🌾',
    team: 'village',
    color: '#8B7355',
  },
  [ROLES.LOBO]: {
    label: 'Hombre Lobo',
    description: 'Cada noche eliminas a un jugador. Mantente oculto entre los aldeanos.',
    icon: '🐺',
    team: 'wolf',
    color: '#C0392B',
  },
  [ROLES.CAZADOR]: {
    label: 'Cazador',
    description: 'Cada noche puedes espiar el rol secreto de un jugador.',
    icon: '🏹',
    team: 'village',
    color: '#27AE60',
  },
  [ROLES.ALQUIMISTA]: {
    label: 'Alquimista',
    description: 'Cada noche preparas una poción y la entregas a un jugador al azar. Si ese jugador muere esa noche, la poción lo salva. Puedes tomar la poción tú mismo solo una vez.',
    icon: '⚗️',
    team: 'village',
    color: '#8E44AD',
  },
};

export const PHASES = {
  LOBBY: 'lobby',
  NIGHT: 'night',
  NIGHT_RESOLVE: 'night_resolve',
  DAY: 'day',
  VOTE: 'vote',
  VOTE_RESOLVE: 'vote_resolve',
  END: 'end',
};

export const NIGHT_STEPS = {
  WOLVES: 'wolves',     // Lobos eligen víctima
  ALCHEMIST: 'alchemist', // Alquimista da poción
  HUNTER: 'hunter',    // Cazador espía
  DONE: 'done',
};

export const WIN_REASON = {
  WOLVES_DEAD: 'wolves_dead',
  ONE_VILLAGER: 'one_villager',
};

export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function generatePlayerId() {
  return Math.random().toString(36).substring(2, 10);
}

export function assignRoles(players, settings) {
  const { wolfCount, hunterCount, alchemistCount } = settings;
  const roles = [];

  for (let i = 0; i < wolfCount; i++) roles.push(ROLES.LOBO);
  for (let i = 0; i < hunterCount; i++) roles.push(ROLES.CAZADOR);
  for (let i = 0; i < alchemistCount; i++) roles.push(ROLES.ALQUIMISTA);

  const remaining = players.length - roles.length;
  for (let i = 0; i < remaining; i++) roles.push(ROLES.FORASTERO);

  // Fisher-Yates shuffle
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  return roles;
}

export function checkWinCondition(players) {
  const alive = Object.values(players).filter(p => p.alive);
  const aliveWolves = alive.filter(p => p.role === ROLES.LOBO);
  const aliveVillagers = alive.filter(p => p.role !== ROLES.LOBO);

  if (aliveWolves.length === 0) {
    return { winner: 'village', reason: WIN_REASON.WOLVES_DEAD };
  }
  if (aliveVillagers.length <= 1) {
    return { winner: 'wolves', reason: WIN_REASON.ONE_VILLAGER };
  }
  return null;
}
