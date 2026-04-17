import {
  generateBalancedGroups,
  getBalancedGroupSizes,
} from '../src/features/tournament/grouping';

describe('tournament grouping helpers', () => {
  it('creates balanced group sizes', () => {
    expect(getBalancedGroupSizes(8, 2)).toEqual([4, 4]);
    expect(getBalancedGroupSizes(10, 3)).toEqual([4, 3, 3]);
    expect(getBalancedGroupSizes(7, 4)).toEqual([2, 2, 2, 1]);
  });

  it('creates deterministic groups for a given seed', () => {
    const teamIds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    const first = generateBalancedGroups({
      teamIds,
      groupCount: 2,
      seed: 'fixed-seed',
    });
    const second = generateBalancedGroups({
      teamIds,
      groupCount: 2,
      seed: 'fixed-seed',
    });

    expect(first).toEqual(second);
  });

  it('keeps every team in exactly one group', () => {
    const teamIds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const groups = generateBalancedGroups({
      teamIds,
      groupCount: 3,
      seed: 'unique-seed',
    });

    const flattened = groups.flatMap(group => group.teamIds);
    expect(flattened).toHaveLength(teamIds.length);
    expect(new Set(flattened).size).toBe(teamIds.length);
    expect(flattened.sort()).toEqual([...teamIds].sort());
  });
});
