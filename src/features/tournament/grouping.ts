import { TournamentDraftGroup } from '../../types/TournamentTypes';

const alphabetLabel = (index: number) => {
  if (index < 26) return `Group ${String.fromCharCode(65 + index)}`;
  return `Group ${index + 1}`;
};

const seededHash = (seed: string) => {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createSeededRandom = (seed: string) => {
  let state = seededHash(seed) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

export const createGroupingSeed = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const getBalancedGroupSizes = (teamCount: number, groupCount: number) => {
  if (groupCount < 1 || teamCount < 1 || groupCount > teamCount) {
    throw new Error('Invalid team or group count.');
  }

  const baseSize = Math.floor(teamCount / groupCount);
  const remainder = teamCount % groupCount;

  return Array.from({ length: groupCount }, (_, index) =>
    index < remainder ? baseSize + 1 : baseSize,
  );
};

export const generateBalancedGroups = ({
  teamIds,
  groupCount,
  seed,
}: {
  teamIds: string[];
  groupCount: number;
  seed: string;
}): TournamentDraftGroup[] => {
  const uniqueTeamIds = Array.from(new Set(teamIds));
  if (uniqueTeamIds.length !== teamIds.length) {
    throw new Error('Duplicate teams cannot be grouped.');
  }
  if (teamIds.length < 2) {
    throw new Error('At least two teams are required.');
  }
  if (groupCount < 1 || groupCount > teamIds.length) {
    throw new Error('Group count must not exceed selected team count.');
  }

  const random = createSeededRandom(seed);
  const shuffled = [...teamIds];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const sizes = getBalancedGroupSizes(shuffled.length, groupCount);
  let offset = 0;

  return sizes.map((size, index) => {
    const groupTeamIds = shuffled.slice(offset, offset + size);
    offset += size;

    return {
      name: alphabetLabel(index),
      order: index + 1,
      teamIds: groupTeamIds,
    };
  });
};
