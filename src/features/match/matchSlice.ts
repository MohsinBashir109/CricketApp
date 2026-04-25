import {
  Ball,
  Innings,
  MatchSettingsReasonChip,
  MatchSetup,
  SetOpenersAndBowlerPayload,
  SuperOverRoundSnapshot,
} from '../../types/Playertype';
import { PayloadAction, createSlice, current } from '@reduxjs/toolkit';
import { ballsToOvers, oversToBalls } from '../../utils/constants';
import { PlayerRole } from '../../types/Playertype';

type EditInningsKey =
  | 'innings1'
  | 'innings2'
  | 'superOverInnings1'
  | 'superOverInnings2';

function renumberBalls(innings: Innings) {
  const balls = innings.balls ?? [];
  let legalInOver = 0;
  let over = 1;
  for (let i = 0; i < balls.length; i++) {
    const b = balls[i] as any;
    b.ballNumber = i + 1;
    const isWide = b.extra === 'wide';
    const isNoBall = b.extra === 'noball';
    const isLegal = !isWide && !isNoBall;
    if (isLegal) {
      legalInOver += 1;
      b.ballInOver = legalInOver;
    } else {
      b.ballInOver = 0;
    }
    b.over = over;
    if (isLegal && legalInOver === 6) {
      over += 1;
      legalInOver = 0;
    }
  }
}

function getEditableInnings(match: MatchSetup, key: EditInningsKey): Innings | null {
  const inn = (match as any)?.[key] as Innings | null | undefined;
  return inn ?? null;
}

function cloneMatchForUndo(match: MatchSetup): MatchSetup {
  return JSON.parse(JSON.stringify(match)) as MatchSetup;
}

function cloneInnings(innings: Innings): Innings {
  return JSON.parse(JSON.stringify(innings)) as Innings;
}

type ScoringInningsKey =
  | 'innings1'
  | 'innings2'
  | 'superOverInnings1'
  | 'superOverInnings2';

function getScoringInningsKey(match: MatchSetup): ScoringInningsKey | null {
  const ci = match.currentInnings;
  if (ci === 1) return 'innings1';
  if (ci === 2) return 'innings2';
  if (ci === 3) return 'superOverInnings1';
  if (ci === 4) return 'superOverInnings2';
  return null;
}

function getInningsByInningNo(
  match: MatchSetup,
  inningNo: number | null | undefined,
): { key: ScoringInningsKey; innings: Innings } | null {
  const no = inningNo ?? match.currentInnings;
  if (no === 1 && match.innings1)
    return { key: 'innings1', innings: match.innings1 };
  if (no === 2 && match.innings2)
    return { key: 'innings2', innings: match.innings2 };
  if (no === 3 && match.superOverInnings1)
    return { key: 'superOverInnings1', innings: match.superOverInnings1 };
  if (no === 4 && match.superOverInnings2)
    return { key: 'superOverInnings2', innings: match.superOverInnings2 };
  return null;
}

function mainInningsRunsForTeam(
  i1: Innings,
  i2: Innings,
  team: 'teamA' | 'teamB',
): number {
  let r = 0;
  if (i1.battingTeam === team) r += i1.totalRuns ?? 0;
  if (i2.battingTeam === team) r += i2.totalRuns ?? 0;
  return r;
}

function superOverRunsForTeam(
  so1: Innings,
  so2: Innings,
  team: 'teamA' | 'teamB',
): number {
  let r = 0;
  if (so1.battingTeam === team) r += so1.totalRuns ?? 0;
  if (so2.battingTeam === team) r += so2.totalRuns ?? 0;
  return r;
}

function clearAllScorerModals(match: MatchSetup) {
  match.innings1 && (match.innings1.activeModal = null);
  match.innings2 && (match.innings2.activeModal = null);
  match.superOverInnings1 && (match.superOverInnings1.activeModal = null);
  match.superOverInnings2 && (match.superOverInnings2.activeModal = null);
}

/** Shared path when a live match is finished and moved to history (matches `resolveTieAsDraw` / auto-complete). */
function archiveFinishedMatch(state: MatchState, match: MatchSetup) {
  clearAllScorerModals(match);
  match.isScoringPaused = false;
  state.lastCompletedMatch = match;
  state.history.push(match);
  state.currentMatch = null;
  state.preBallSnapshots = [];
}

export type ApplyMatchSettingsPayload =
  | {
      kind: 'interruption';
      reason: MatchSettingsReasonChip;
      note?: string;
    }
  | {
      kind: 'no_result';
      reason: MatchSettingsReasonChip;
      note?: string;
    }
  | {
      kind: 'tie';
      reason: MatchSettingsReasonChip;
      note?: string;
    }
  | {
      kind: 'manual_winner';
      winner: 'teamA' | 'teamB';
      reason: MatchSettingsReasonChip;
      note?: string;
    };

interface MatchState {
  currentMatch: MatchSetup | null;
  history: MatchSetup[];
  lastCompletedMatch: MatchSetup | null;
  /** One snapshot per ball recorded (for undo). Not part of MatchSetup. */
  preBallSnapshots: MatchSetup[];
}
const initialState: MatchState = {
  currentMatch: null,
  history: [],
  lastCompletedMatch: null,
  preBallSnapshots: [],
};

const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    /** Move an already-completed match into history (UI can show completion modal before calling this). */
    archiveCompletedMatch(state) {
      const match = state.currentMatch;
      if (!match) return;
      if (!match.isCompleted) return;
      archiveFinishedMatch(state, match);
    },
    setmatch(state, action: PayloadAction<MatchSetup>) {
      state.preBallSnapshots = [];
      state.lastCompletedMatch = null;
      state.currentMatch = {
        ...action.payload,
        isCompleted: false,
        winnerTeam: null,
        winnerTeamName: '',
        resultReason: undefined,
        isScoringPaused: action.payload.isScoringPaused ?? false,
      };
    },

    setScoringPaused(state, action: PayloadAction<boolean>) {
      const match = state.currentMatch;
      if (!match) return;
      match.isScoringPaused = action.payload;
    },
    updateMatch(state, action: PayloadAction<Partial<MatchSetup>>) {
      if (state.currentMatch) {
        state.currentMatch = {
          ...state.currentMatch,
          ...action.payload,
        };
      }
    },

    addLivePlayerToTeam(
      state,
      action: PayloadAction<{
        teamKey: 'teamA' | 'teamB';
        name: string;
        role?: PlayerRole;
        canBat?: boolean;
        canBowl?: boolean;
        canField?: boolean;
        isSubstitute?: boolean;
        lateAdded?: boolean;
        jerseyNumber?: number;
      }>,
    ) {
      const match = state.currentMatch;
      if (!match) return;
      if (match.isCompleted) return;

      const team = action.payload.teamKey === 'teamA' ? match.teamA : match.teamB;
      if (!team) return;
      const cap = match.playersPerTeam;
      if (typeof cap === 'number' && cap > 0 && (team.players?.length ?? 0) >= cap) return;

      const name = (action.payload.name ?? '').trim();
      if (!name) return;

      const exists = (team.players ?? []).some(
        p => (p.name ?? '').trim().toLowerCase() === name.toLowerCase(),
      );
      if (exists) return;

      const id = Date.now() + Math.floor(Math.random() * 1000);
      const isSubstitute = !!action.payload.isSubstitute;
      const canBat =
        typeof action.payload.canBat === 'boolean'
          ? action.payload.canBat
          : isSubstitute
            ? false
            : true;
      const canBowl =
        typeof action.payload.canBowl === 'boolean'
          ? action.payload.canBowl
          : isSubstitute
            ? false
            : true;
      const canField =
        typeof action.payload.canField === 'boolean'
          ? action.payload.canField
          : true;
      const lateAdded = !!action.payload.lateAdded;
      const next = {
        id,
        name,
        role: action.payload.role,
        canBat,
        canBowl,
        canField,
        isSubstitute,
        lateAdded,
        jerseyNumber:
          typeof action.payload.jerseyNumber === 'number'
            ? action.payload.jerseyNumber
            : undefined,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        overs: 0,
        maidens: 0,
        conceded: 0,
        wickets: 0,
        wides: 0,
        noBalls: 0,
      };

      if (!team.players) team.players = [];
      team.players.push(next as any);
    },

    addMultipleLivePlayersToTeam(
      state,
      action: PayloadAction<{
        teamKey: 'teamA' | 'teamB';
        names: string[];
        role?: PlayerRole;
        /** Defaults applied to each created player (can be overridden later). */
        defaults?: {
          canBat?: boolean;
          canBowl?: boolean;
          canField?: boolean;
          isSubstitute?: boolean;
          lateAdded?: boolean;
        };
      }>,
    ) {
      const match = state.currentMatch;
      if (!match) return;
      if (match.isCompleted) return;

      const team = action.payload.teamKey === 'teamA' ? match.teamA : match.teamB;
      if (!team) return;
      if (!team.players) team.players = [];
      const cap = match.playersPerTeam;

      const existingLower = new Set(
        (team.players ?? []).map(p => (p.name ?? '').trim().toLowerCase()),
      );

      const defaults = action.payload.defaults ?? {};
      const isSubstitute = !!defaults.isSubstitute;
      const canBat =
        typeof defaults.canBat === 'boolean' ? defaults.canBat : isSubstitute ? false : true;
      const canBowl =
        typeof defaults.canBowl === 'boolean' ? defaults.canBowl : isSubstitute ? false : true;
      const canField = typeof defaults.canField === 'boolean' ? defaults.canField : true;
      const lateAdded = !!defaults.lateAdded;

      const uniqueNames: string[] = [];
      for (const raw of action.payload.names ?? []) {
        const nm = (raw ?? '').trim().replace(/\s+/g, ' ');
        if (!nm) continue;
        const key = nm.toLowerCase();
        if (existingLower.has(key)) continue;
        if (uniqueNames.some(x => x.toLowerCase() === key)) continue;
        uniqueNames.push(nm);
      }

      for (const nm of uniqueNames) {
        if (typeof cap === 'number' && cap > 0 && (team.players?.length ?? 0) >= cap) break;
        const id = Date.now() + Math.floor(Math.random() * 1000) + uniqueNames.indexOf(nm);
        team.players.push({
          id,
          name: nm,
          role: action.payload.role,
          canBat,
          canBowl,
          canField,
          isSubstitute,
          lateAdded,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          overs: 0,
          maidens: 0,
          conceded: 0,
          wickets: 0,
          wides: 0,
          noBalls: 0,
        } as any);
        existingLower.add(nm.toLowerCase());
      }
    },

    updateLivePlayerRole(
      state,
      action: PayloadAction<{
        teamKey: 'teamA' | 'teamB';
        playerId: number;
        role?: PlayerRole;
      }>,
    ) {
      const match = state.currentMatch;
      if (!match) return;
      if (match.isCompleted) return;
      const team = action.payload.teamKey === 'teamA' ? match.teamA : match.teamB;
      if (!team?.players) return;
      const p = team.players.find(x => Number(x.id) === Number(action.payload.playerId));
      if (!p) return;
      p.role = action.payload.role;
    },

    editBall(
      state,
      action: PayloadAction<{
        inningsKey: EditInningsKey;
        ballIndex: number;
        patch: Partial<Pick<Ball, 'runs' | 'extra' | 'extraRuns' | 'runsOffBat'>>;
      }>,
    ) {
      const match = state.currentMatch;
      if (!match) return;
      const innings = getEditableInnings(match, action.payload.inningsKey);
      if (!innings?.balls) return;
      const idx = action.payload.ballIndex;
      if (idx < 0 || idx >= innings.balls.length) return;

      const b = innings.balls[idx] as any;
      // Scope A: do not allow editing wicket/ids.
      b.runs = action.payload.patch.runs ?? b.runs;
      b.extra = action.payload.patch.extra ?? b.extra;
      b.extraRuns =
        action.payload.patch.extraRuns !== undefined ? action.payload.patch.extraRuns : b.extraRuns;
      b.runsOffBat =
        action.payload.patch.runsOffBat !== undefined ? action.payload.patch.runsOffBat : b.runsOffBat;

      renumberBalls(innings);
    },

    deleteBall(
      state,
      action: PayloadAction<{ inningsKey: EditInningsKey; ballIndex: number }>,
    ) {
      const match = state.currentMatch;
      if (!match) return;
      const innings = getEditableInnings(match, action.payload.inningsKey);
      if (!innings?.balls) return;
      const idx = action.payload.ballIndex;
      if (idx < 0 || idx >= innings.balls.length) return;
      innings.balls.splice(idx, 1);
      renumberBalls(innings);
    },

    insertBall(
      state,
      action: PayloadAction<{
        inningsKey: EditInningsKey;
        afterBallIndex: number;
        ball: Pick<Ball, 'runs' | 'extra' | 'extraRuns' | 'runsOffBat' | 'strikerId' | 'bowlerId'>;
      }>,
    ) {
      const match = state.currentMatch;
      if (!match) return;
      const innings = getEditableInnings(match, action.payload.inningsKey);
      if (!innings) return;
      if (!innings.balls) innings.balls = [];

      const insertAt = Math.min(
        Math.max(action.payload.afterBallIndex + 1, 0),
        innings.balls.length,
      );

      const base: Ball = {
        ballNumber: 0,
        over: 0,
        ballInOver: 0,
        runs: action.payload.ball.runs ?? 0,
        extra: action.payload.ball.extra ?? null,
        extraRuns: action.payload.ball.extraRuns,
        runsOffBat: action.payload.ball.runsOffBat ?? 0,
        wicket: false,
        dismissedBatsmanId: null,
        strikerId: action.payload.ball.strikerId ?? null,
        bowlerId: action.payload.ball.bowlerId ?? null,
      };

      innings.balls.splice(insertAt, 0, base);
      renumberBalls(innings);
    },

    annotateLastDismissal(
      state,
      action: PayloadAction<{
        outType:
          | 'bowled'
          | 'caught'
          | 'lbw'
          | 'runout'
          | 'stumped'
          | 'hitwicket'
          | 'retired'
          | '';
        outByBowlerId?: number | string | null;
        outByFielderId?: number | string | null;
      }>,
    ) {
      const match = state.currentMatch;
      if (!match) return;
      if (match.isCompleted) return;
      const key = getScoringInningsKey(match);
      if (!key) return;
      const innings = match[key];
      if (!innings) return;

      // Find last dismissed batter from balls history.
      let dismissedId: number | null = null;
      for (let i = (innings.balls?.length ?? 0) - 1; i >= 0; i--) {
        const b = innings.balls[i];
        if (b?.dismissedBatsmanId != null) {
          dismissedId = b.dismissedBatsmanId ?? null;
          break;
        }
      }
      if (dismissedId == null) return;

      const batTeam = match[innings.battingTeam];
      if (!batTeam) return;
      const p = batTeam.players?.find(x => x.id === dismissedId);
      if (!p) return;

      p.outType = action.payload.outType;
      p.outByBowlerId =
        action.payload.outByBowlerId == null ? null : String(action.payload.outByBowlerId);
      p.outByFielderId =
        action.payload.outByFielderId == null ? null : String(action.payload.outByFielderId);
    },
    // addStrikerAndBowlerInnings(state, action: PayloadAction<any>) {
    //   const match = state.currentMatch;
    //   if (!match) return;

    //   const strikerId = action.payload.StrikerId;
    //   const nonStrikerId = action.payload.nonStrikerId;
    //   const bowlerId = action.payload.bowlerId;

    //   // Choose innings: payload > currentInnings
    //   // const inningNo = innings ?? match.currentInnings;
    //   // const inningsKey = inningNo === 2 ? 'innings2' : 'innings1';
    //   // const inningsObj = match[inningsKey];

    //   // if (!inningsObj) return;

    //   // Basic guards
    //   if (strikerId == null || nonStrikerId == null || bowlerId == null) return;
    //   if (String(strikerId) === String(nonStrikerId)) return; // same batsman not allowed

    //   // Assign in innings object
    //   // inningsObj.strikerId = strikerId;
    //   // inningsObj.nonStrikerId = nonStrikerId;
    //   // inningsObj.bowlerId = bowlerId;

    //   // Optional: mark batsman flags on team players (if you want UI convenience)
    //   // const battingTeamKey = inningsObj.battingTeam as 'teamA' | 'teamB';
    //   // const battingPlayers = match[battingTeamKey]?.players ?? [];
    //   // battingPlayers.forEach(p => {
    //   //   p.isStriker = String(p.id) === String(strikerId);
    //   // });
    //   state.currentMatch?.innings1?.strikerId = strikerId;
    //   state.currentMatch?.innings1?.nonStrikerId = nonStrikerId;
    //   state.currentMatch?.innings1?.bowlerId = strikerId;
    // },
    addStrikerAndBowlerInnings(
      state,
      action: PayloadAction<SetOpenersAndBowlerPayload>,
    ) {
      const match = state.currentMatch;
      if (!match) return;

      const { strikerId, nonStrikerId, bowlerId, innings } = action.payload;

      // basic guards
      if (strikerId === nonStrikerId) return;

      const inningNo = innings ?? match.currentInnings;
      const found = getInningsByInningNo(match, inningNo);
      if (!found) return;
      const inningsObj = found.innings;

      const battingTeam = match[inningsObj.battingTeam];
      const bowlingTeam = match[inningsObj.bowlingTeam];
      const battingPlayers = battingTeam?.players ?? [];
      const bowlingPlayers = bowlingTeam?.players ?? [];

      const strikerExists = battingPlayers.some(p => p.id === strikerId);
      const nonStrikerExists = battingPlayers.some(p => p.id === nonStrikerId);
      const bowlerExists = bowlingPlayers.some(p => p.id === bowlerId);

      if (!strikerExists || !nonStrikerExists || !bowlerExists) return;

      // set inside innings object
      inningsObj.strikerId = strikerId;
      inningsObj.nonStrikerId = nonStrikerId;
      inningsObj.bowlerId = bowlerId;
      inningsObj.openingStrikerId = strikerId;
      inningsObj.openingNonStrikerId = nonStrikerId;
      inningsObj.openingBowlerId = bowlerId;
    },
    setActiveModal(
      state,
      action: PayloadAction<'OPENERS' | 'NEXT_BATSMAN' | 'NEXT_BOWLER' | null>,
    ) {
      const match = state.currentMatch;
      if (!match) return;
      if (match.isCompleted) return;

      const key = getScoringInningsKey(match);
      if (!key) return;
      const innings = match[key];
      if (!innings) return;
      if (innings.isCompleted) return;

      innings.activeModal = action.payload;
    },

    setNextBatsman(
      state,
      action: PayloadAction<{
        batsmanId: number;
        target?: 'STRIKER' | 'NON_STRIKER';
      }>,
    ) {
      const match = state.currentMatch;
      if (!match) return;

      const key = getScoringInningsKey(match);
      if (!key) return;
      const innings = match[key];
      if (!innings) return;

      const { batsmanId, target } = action.payload;

      // choose who to replace (default from innings.outTarget)
      const outTarget = target ?? innings.outTarget ?? 'STRIKER';

      // prevent selecting same as existing batter
      if (outTarget === 'STRIKER' && innings.nonStrikerId === batsmanId) return;
      if (outTarget === 'NON_STRIKER' && innings.strikerId === batsmanId)
        return;

      // set the new batsman
      if (outTarget === 'STRIKER') innings.strikerId = batsmanId;
      else innings.nonStrikerId = batsmanId;

      innings.outTarget = null;

      // if wicket happened on end of over and we queued bowler change
      if (innings.pendingBowlerChange) {
        innings.pendingBowlerChange = false;
        innings.activeModal = 'NEXT_BOWLER';
      } else {
        innings.activeModal = null;
      }
    },

    setNextBowler(state, action: PayloadAction<{ bowlerId: number }>) {
      const match = state.currentMatch;
      if (!match) return;

      const key = getScoringInningsKey(match);
      if (!key) return;
      const innings = match[key];
      if (!innings) return;

      innings.bowlerId = action.payload.bowlerId;
      innings.activeModal = null;
    },
    startSecondInnings(state) {
      const match = state.currentMatch;
      if (!match) return;

      // must have first innings
      if (!match.innings1) return;

      // only start if innings1 is completed
      if (!match.innings1.isCompleted) return;

      // already started
      if (match.currentInnings === 2) return;

      // swap teams: innings2 batting = innings1 bowling
      const battingTeam: 'teamA' | 'teamB' = match.innings1.bowlingTeam;
      const bowlingTeam: 'teamA' | 'teamB' = match.innings1.battingTeam;

      const battingTeamObj =
        battingTeam === 'teamA' ? match.teamA : match.teamB;
      const bowlingTeamObj =
        bowlingTeam === 'teamA' ? match.teamA : match.teamB;

      // create/reset innings2
      match.innings2 = {
        battingTeam,
        bowlingTeam,
        battingTeamName: battingTeamObj?.name ?? '',
        bowlingTeamName: bowlingTeamObj?.name ?? '',

        totalRuns: 0,
        totalWickets: 0,
        totalBalls: 0,

        strikerId: null,
        nonStrikerId: null,
        bowlerId: null,

        balls: [],

        activeModal: 'OPENERS',
        outTarget: 'STRIKER',
        pendingBowlerChange: false,

        isCompleted: false,
        winnerReason: undefined,
      };

      match.currentInnings = 2;
      state.preBallSnapshots = [];
    },

    recordBall(
      state,
      action: PayloadAction<{
        runsOffBat?: 0 | 1 | 2 | 3 | 4 | 6;
        extra?: 'wide' | 'noball' | 'bye' | 'legbye' | null;
        extraRuns?: number;
        wicket?: boolean;
      }>,
    ) {
      const match = state.currentMatch;
      if (!match) return;
      if (match.isScoringPaused) return;
      if (match.pendingTieResolution) return;
      if (!state.preBallSnapshots) state.preBallSnapshots = [];

      const key = getScoringInningsKey(match);
      if (!key) return;
      const innings = match[key]!;

      if (!innings) return;
      if (innings.isCompleted) return;

      // ✅ OVERS LIMIT GUARD (legal balls only)
      const oversLimit = Number(match.overs ?? 0);
      const maxBalls =
        key === 'superOverInnings1' || key === 'superOverInnings2'
          ? 6
          : oversLimit > 0
            ? oversLimit * 6
            : Infinity;

      // if innings already ended by overs or all-out, block scoring
      if (innings.isCompleted) return;
      if (innings.totalBalls >= maxBalls) {
        innings.isCompleted = true;
        innings.activeModal = null;
        innings.winnerReason = 'OVERS_DONE';
        return;
      }

      const { strikerId, nonStrikerId, bowlerId } = innings;
      if (!strikerId || !nonStrikerId || !bowlerId) return;

      const batTeam =
        innings.battingTeam === 'teamA' ? match.teamA : match.teamB;
      const bowlTeam =
        innings.bowlingTeam === 'teamA' ? match.teamA : match.teamB;
      if (!batTeam || !bowlTeam) return;

      const striker = batTeam.players.find(p => p.id === strikerId);
      const bowler = bowlTeam.players.find(p => p.id === bowlerId);
      if (!striker || !bowler) return;

      const snap = cloneMatchForUndo(current(state.currentMatch) as MatchSetup);
      state.preBallSnapshots.push(snap);

      const runsOffBat = action.payload.runsOffBat ?? 0;
      const extra = action.payload.extra ?? null;
      const extraRuns =
        action.payload.extraRuns ??
        (extra === 'wide' || extra === 'noball' ? 1 : 0);

      const isWide = extra === 'wide';
      const isNoBall = extra === 'noball';
      const isBye = extra === 'bye';
      const isLegBye = extra === 'legbye';

      // ✅ Legal ball (wide/noBall are NOT legal)
      const isLegal = !isWide && !isNoBall;

      const totalRuns = isBye || isLegBye ? extraRuns : runsOffBat + extraRuns;

      const over = Math.floor(innings.totalBalls / 6) + 1;
      const ballInOver = (innings.totalBalls % 6) + 1;

      const newBall: Ball = {
        ballNumber: innings.balls.length + 1,
        over,
        ballInOver: isLegal ? ballInOver : 0,
        runs: totalRuns,
        extra,
        extraRuns,
        runsOffBat,
        wicket: !!action.payload.wicket,
        strikerId,
        bowlerId,
      };

      innings.balls.push(newBall);

      // Update innings totals
      innings.totalRuns += totalRuns;

      // ✅ WICKET
      if (action.payload.wicket) {
        innings.totalWickets += 1;

        const outTarget: 'STRIKER' | 'NON_STRIKER' =
          innings.outTarget ?? 'STRIKER';
        const outId =
          outTarget === 'STRIKER' ? innings.strikerId : innings.nonStrikerId;

        if (outId != null) {
          newBall.dismissedBatsmanId = outId;
          const outPlayer = batTeam.players.find(p => p.id === outId);
          if (outPlayer) outPlayer.isOut = true;
        }

        if (outTarget === 'STRIKER') innings.strikerId = null;
        else innings.nonStrikerId = null;

        innings.activeModal = 'NEXT_BATSMAN';
        innings.outTarget = outTarget;

        const willEndOver = isLegal && (innings.totalBalls + 1) % 6 === 0;
        if (willEndOver) innings.pendingBowlerChange = true;

        // ✅ ALL OUT CHECK (dynamic team size)
        const batCount = batTeam.players.length;
        const maxWickets = Math.max(batCount - 1, 0); // 11 => 10 wickets, 5 => 4 wickets
        if (batCount <= 1 || innings.totalWickets >= maxWickets) {
          innings.isCompleted = true;
          innings.activeModal = null; // close modal; innings finished
          innings.pendingBowlerChange = false;
          innings.winnerReason = 'ALL_OUT';
          return;
        }
      }

      // Batsman stats: balls faced only on legal balls
      if (isLegal) {
        striker.balls = (striker.balls ?? 0) + 1;
      }

      // Batsman runs only when NOT bye/legbye
      if (!isBye && !isLegBye) {
        striker.runs = (striker.runs ?? 0) + runsOffBat;
        if (runsOffBat === 4) striker.fours = (striker.fours ?? 0) + 1;
        if (runsOffBat === 6) striker.sixes = (striker.sixes ?? 0) + 1;
      }

      // Bowler stats
      bowler.conceded = (bowler.conceded ?? 0) + totalRuns;
      if (isWide) bowler.wides = (bowler.wides ?? 0) + extraRuns;
      if (isNoBall) bowler.noBalls = (bowler.noBalls ?? 0) + extraRuns;
      if (action.payload.wicket) bowler.wickets = (bowler.wickets ?? 0) + 1;

      // ✅ increment legal ball + check overs end
      if (isLegal) {
        const prevBalls = oversToBalls(bowler.overs);
        bowler.overs = ballsToOvers(prevBalls + 1);
        innings.totalBalls += 1;

        // ✅ OVERS DONE CHECK after increment
        if (innings.totalBalls >= maxBalls) {
          innings.isCompleted = true;
          innings.activeModal = null;
          innings.pendingBowlerChange = false;
          innings.winnerReason = 'OVERS_DONE';
          return;
        }
      }
      if (match.currentInnings === 2 && match.innings1) {
        const target = (match.innings1.totalRuns ?? 0) + 1;
        if ((innings.totalRuns ?? 0) >= target) {
          innings.isCompleted = true;
          innings.activeModal = null;
          innings.pendingBowlerChange = false;
          innings.winnerReason = 'TARGET_CHASED';
          return;
        }
      }
      if (match.currentInnings === 4 && match.superOverInnings1) {
        const target = (match.superOverInnings1.totalRuns ?? 0) + 1;
        if ((innings.totalRuns ?? 0) >= target) {
          innings.isCompleted = true;
          innings.activeModal = null;
          innings.pendingBowlerChange = false;
          innings.winnerReason = 'TARGET_CHASED';
          return;
        }
      }

      // Strike rotation on odd totals (includes wides/no-balls)
      if (totalRuns % 2 === 1) {
        const tmp = innings.strikerId;
        innings.strikerId = innings.nonStrikerId;
        innings.nonStrikerId = tmp;
      }

      // End of over (only after legal 6th ball)
      if (isLegal && innings.totalBalls % 6 === 0) {
        const tmp = innings.strikerId;
        innings.strikerId = innings.nonStrikerId;
        innings.nonStrikerId = tmp;

        // ✅ only ask for bowler if innings NOT completed (we already returned above if overs done)
        innings.bowlerId = null;

        if (innings.activeModal === 'NEXT_BATSMAN') {
          innings.pendingBowlerChange = true;
        } else {
          innings.activeModal = 'NEXT_BOWLER';
        }
      }
    },
    completeMatchIfNeeded(state) {
      const match = state.currentMatch;
      if (!match) return;
      if (match.pendingTieResolution) return;
      if ((match.currentInnings ?? 1) > 2) return;

      const i1 = match.innings1;
      const i2 = match.innings2;

      if (!i1 || !i2) return;
      if (!i1.isCompleted || !i2.isCompleted) return;
      if (match.isCompleted) return;

      const teamARuns = mainInningsRunsForTeam(i1, i2, 'teamA');
      const teamBRuns = mainInningsRunsForTeam(i1, i2, 'teamB');

      if (teamARuns === teamBRuns) {
        match.pendingTieResolution = true;
        match.isScoringPaused = true;
        clearAllScorerModals(match);
        return;
      }

      let winnerTeam: 'teamA' | 'teamB' | null = null;
      let resultReason: MatchSetup['resultReason'] = 'TIE';

      if (teamARuns > teamBRuns) {
        winnerTeam = 'teamA';
        resultReason = 'DEFENDED';
      } else {
        winnerTeam = 'teamB';
        resultReason = 'CHASED';
      }

      match.isCompleted = true;
      match.winnerTeam = winnerTeam;
      match.winnerTeamName =
        winnerTeam === 'teamA'
          ? match.teamA?.name ?? ''
          : match.teamB?.name ?? '';
      match.resultReason = resultReason;
      // Do not archive immediately — allow UI to show completion modal on scoring screen.
    },

    resolveTieAsDraw(state) {
      const match = state.currentMatch;
      if (!match?.pendingTieResolution) return;

      const hadCompletedSuperOver =
        (match.superOverHistory?.length ?? 0) > 0 ||
        (!!match.superOverInnings1?.isCompleted &&
          !!match.superOverInnings2?.isCompleted);

      match.pendingTieResolution = false;
      match.isScoringPaused = false;
      match.isCompleted = true;
      match.winnerTeam = null;
      match.winnerTeamName = '';
      match.resultReason = 'TIE';
      match.tieResolvedBy = hadCompletedSuperOver ? 'super_over_tied' : 'draw';
      // Do not archive immediately — allow UI to show completion modal on scoring screen.
    },

    beginSuperOver(state) {
      const match = state.currentMatch;
      if (!match?.pendingTieResolution) return;
      if (!match.innings1 || !match.innings2) return;

      // Archive a completed tied Super Over before starting the next round (repeat until decisive).
      const prevSo1 = match.superOverInnings1;
      const prevSo2 = match.superOverInnings2;
      if (prevSo1?.isCompleted && prevSo2?.isCompleted) {
        if (!match.superOverHistory) match.superOverHistory = [];
        const snap: SuperOverRoundSnapshot = {
          inning1: cloneInnings(prevSo1),
          inning2: cloneInnings(prevSo2),
        };
        match.superOverHistory.push(snap);
      }

      match.pendingTieResolution = false;
      match.isScoringPaused = false;
      match.superOverInnings1 = undefined;
      match.superOverInnings2 = undefined;

      const battingTeam = match.innings2.battingTeam;
      const bowlingTeam = match.innings2.bowlingTeam;
      const battingTeamObj =
        battingTeam === 'teamA' ? match.teamA : match.teamB;
      const bowlingTeamObj =
        bowlingTeam === 'teamA' ? match.teamA : match.teamB;

      match.superOverInnings1 = {
        battingTeam,
        bowlingTeam,
        battingTeamName: battingTeamObj?.name ?? '',
        bowlingTeamName: bowlingTeamObj?.name ?? '',
        totalRuns: 0,
        totalWickets: 0,
        totalBalls: 0,
        strikerId: null,
        nonStrikerId: null,
        bowlerId: null,
        balls: [],
        activeModal: 'OPENERS',
        outTarget: 'STRIKER',
        pendingBowlerChange: false,
        isCompleted: false,
        winnerReason: undefined,
      };

      match.currentInnings = 3;
      state.preBallSnapshots = [];
    },

    startSuperOverSecondInnings(state) {
      const match = state.currentMatch;
      if (!match) return;
      const so1 = match.superOverInnings1;
      if (!so1?.isCompleted) return;
      if (match.currentInnings !== 3) return;
      if (match.superOverInnings2) return;

      const battingTeam = so1.bowlingTeam;
      const bowlingTeam = so1.battingTeam;
      const battingTeamObj =
        battingTeam === 'teamA' ? match.teamA : match.teamB;
      const bowlingTeamObj =
        bowlingTeam === 'teamA' ? match.teamA : match.teamB;

      match.superOverInnings2 = {
        battingTeam,
        bowlingTeam,
        battingTeamName: battingTeamObj?.name ?? '',
        bowlingTeamName: bowlingTeamObj?.name ?? '',
        totalRuns: 0,
        totalWickets: 0,
        totalBalls: 0,
        strikerId: null,
        nonStrikerId: null,
        bowlerId: null,
        balls: [],
        activeModal: 'OPENERS',
        outTarget: 'STRIKER',
        pendingBowlerChange: false,
        isCompleted: false,
        winnerReason: undefined,
      };

      match.currentInnings = 4;
      state.preBallSnapshots = [];
    },

    completeSuperOverIfNeeded(state) {
      const match = state.currentMatch;
      if (!match) return;
      if (match.pendingTieResolution) return;
      if (match.isCompleted) return;

      const so1 = match.superOverInnings1;
      const so2 = match.superOverInnings2;
      if (!so1?.isCompleted || !so2?.isCompleted) return;

      const ra = superOverRunsForTeam(so1, so2, 'teamA');
      const rb = superOverRunsForTeam(so1, so2, 'teamB');

      if (ra === rb) {
        match.pendingTieResolution = true;
        match.isScoringPaused = true;
        clearAllScorerModals(match);
        return;
      }

      const winnerTeam: 'teamA' | 'teamB' = ra > rb ? 'teamA' : 'teamB';
      const secondBatting = so2.battingTeam;
      const resultReason: MatchSetup['resultReason'] =
        winnerTeam === secondBatting ? 'CHASED' : 'DEFENDED';

      match.isCompleted = true;
      match.winnerTeam = winnerTeam;
      match.winnerTeamName =
        winnerTeam === 'teamA'
          ? match.teamA?.name ?? ''
          : match.teamB?.name ?? '';
      match.resultReason = resultReason;
      match.tieResolvedBy = 'super_over';
      // Do not archive immediately — allow UI to show completion modal on scoring screen.
    },

    applyMatchSettingsDecision(state, action: PayloadAction<ApplyMatchSettingsPayload>) {
      const match = state.currentMatch;
      if (!match || match.isCompleted) return;

      const payload = action.payload;
      const noteTrim = (payload.note ?? '').trim();
      const reason = payload.reason;

      const writeMeta = () => {
        match.matchSettingsReason = reason;
        match.matchSettingsNote = noteTrim || undefined;
      };

      if (payload.kind === 'interruption') {
        writeMeta();
        return;
      }

      writeMeta();
      match.pendingTieResolution = false;

      if (payload.kind === 'no_result') {
        match.isCompleted = true;
        match.winnerTeam = null;
        match.winnerTeamName = '';
        match.resultReason = 'NO_RESULT';
        match.tieResolvedBy = undefined;
        // Do not archive immediately — allow UI to show completion modal on scoring screen.
        return;
      }

      if (payload.kind === 'tie') {
        const hadCompletedSuperOver =
          (match.superOverHistory?.length ?? 0) > 0 ||
          (!!match.superOverInnings1?.isCompleted &&
            !!match.superOverInnings2?.isCompleted);
        match.isCompleted = true;
        match.winnerTeam = null;
        match.winnerTeamName = '';
        match.resultReason = 'TIE';
        match.tieResolvedBy = hadCompletedSuperOver ? 'super_over_tied' : 'draw';
        // Do not archive immediately — allow UI to show completion modal on scoring screen.
        return;
      }

      if (payload.kind === 'manual_winner') {
        const w = payload.winner;
        const hadCompletedSuperOver =
          !!match.superOverInnings1?.isCompleted &&
          !!match.superOverInnings2?.isCompleted;
        match.isCompleted = true;
        match.winnerTeam = w;
        match.winnerTeamName =
          w === 'teamA' ? match.teamA?.name ?? '' : match.teamB?.name ?? '';
        match.resultReason = 'DEFENDED';
        match.tieResolvedBy = hadCompletedSuperOver ? 'super_over' : undefined;
        // Do not archive immediately — allow UI to show completion modal on scoring screen.
      }
    },

    undoLastBall(state) {
      if (!state.preBallSnapshots) state.preBallSnapshots = [];
      const match = state.currentMatch;
      if (!match) return;

      const key = getScoringInningsKey(match);
      if (!key) return;
      const innings = match[key];
      if (!innings) return;

      if (innings.balls.length === 0) return;

      const prev = state.preBallSnapshots.pop();
      if (!prev) return;

      state.currentMatch = prev;
    },
    setHistory(state, action: PayloadAction<MatchSetup[]>) {
      state.history = action.payload;
    },

    endMatch(state) {
      if (state.currentMatch) {
        state.history.push(state.currentMatch);
        state.currentMatch = null;
      }
      state.lastCompletedMatch = null;
      state.preBallSnapshots = [];
    },
    clearHistory(state) {
      state.history = [];
      state.preBallSnapshots = [];
    },

    clearLastCompletedMatch(state) {
      state.lastCompletedMatch = null;
    },
  },
});
export const {
  setmatch,
  updateMatch,
  addLivePlayerToTeam,
  addMultipleLivePlayersToTeam,
  updateLivePlayerRole,
  annotateLastDismissal,
  editBall,
  deleteBall,
  insertBall,
  endMatch,
  archiveCompletedMatch,
  clearHistory,
  clearLastCompletedMatch,
  addStrikerAndBowlerInnings,
  recordBall,
  undoLastBall,
  setNextBatsman,
  setNextBowler,
  setActiveModal,
  setScoringPaused,
  startSecondInnings,
  completeMatchIfNeeded,
  resolveTieAsDraw,
  beginSuperOver,
  startSuperOverSecondInnings,
  completeSuperOverIfNeeded,
  applyMatchSettingsDecision,
  setHistory,
} = matchSlice.actions;
export default matchSlice.reducer;
