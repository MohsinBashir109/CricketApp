import {
  MatchSetup,
  Player,
  SetOpenersAndBowlerPayload,
} from '../../types/Playertype';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { ballsToOvers, oversToBalls } from '../../utils/constants';

interface MatchState {
  currentMatch: MatchSetup | null;
  history: MatchSetup[];
}
const initialState: MatchState = {
  currentMatch: null,
  history: [],
};

const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    setmatch(state, action: PayloadAction<MatchSetup>) {
      state.currentMatch = {
        ...action.payload,
        isCompleted: false,
        winnerTeam: null,
        winnerTeamName: '',
        resultReason: undefined,
      };
    },
    updateMatch(state, action: PayloadAction<Partial<MatchSetup>>) {
      if (state.currentMatch) {
        state.currentMatch = {
          ...state.currentMatch,
          ...action.payload,
        };
      }
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
      const inningsKey: 'innings1' | 'innings2' =
        inningNo === 2 ? 'innings2' : 'innings1';

      const inningsObj = match[inningsKey];
      if (!inningsObj) return;

      // optional strict validation against team players
      // const battingPlayers = match[inningsObj.battingTeam].players;
      // const bowlingPlayers = match[inningsObj.bowlingTeam].players;

      // const strikerExists = battingPlayers.some(p => p.id === strikerId);
      // const nonStrikerExists = battingPlayers.some(p => p.id === nonStrikerId);
      // const bowlerExists = bowlingPlayers.some(p => p.id === bowlerId);

      // if (!strikerExists || !nonStrikerExists || !bowlerExists) return;

      // set inside innings object
      inningsObj.strikerId = strikerId;
      inningsObj.nonStrikerId = nonStrikerId;
      inningsObj.bowlerId = bowlerId;
    },
    setActiveModal(
      state,
      action: PayloadAction<'OPENERS' | 'NEXT_BATSMAN' | 'NEXT_BOWLER' | null>,
    ) {
      const match = state.currentMatch;
      if (!match) return;

      const inningsKey: 'innings1' | 'innings2' =
        match.currentInnings === 2 ? 'innings2' : 'innings1';
      const innings = match[inningsKey];
      if (!innings) return;

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

      const inningsKey: 'innings1' | 'innings2' =
        match.currentInnings === 2 ? 'innings2' : 'innings1';
      const innings = match[inningsKey];
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

      const inningsKey: 'innings1' | 'innings2' =
        match.currentInnings === 2 ? 'innings2' : 'innings1';
      const innings = match[inningsKey];
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

      const inningsKey: 'innings1' | 'innings2' =
        match.currentInnings === 2 ? 'innings2' : 'innings1';
      const innings = match[inningsKey];

      if (!innings) return;
      if (innings.isCompleted) return;

      // ✅ OVERS LIMIT GUARD (legal balls only)
      const oversLimit = Number(match.overs ?? 0); // make sure match.overs is number OR string-number
      const maxBalls = oversLimit > 0 ? oversLimit * 6 : Infinity;

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

      const newBall = {
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

      const i1 = match.innings1;
      const i2 = match.innings2;

      // need both innings
      if (!i1 || !i2) return;

      // must both be completed
      if (!i1.isCompleted || !i2.isCompleted) return;

      // prevent double-run
      if (match.isCompleted) return;

      // -----------------------------
      // Decide winner (simple version)
      // -----------------------------
      const teamARuns =
        i1.battingTeam === 'teamA' ? i1.totalRuns : i2.totalRuns;

      const teamBRuns =
        i1.battingTeam === 'teamB' ? i1.totalRuns : i2.totalRuns;

      let winnerTeam: 'teamA' | 'teamB' | null = null;
      let resultReason: MatchSetup['resultReason'] = 'TIE';

      if (teamARuns > teamBRuns) {
        winnerTeam = 'teamA';
        resultReason = 'DEFENDED'; // or just 'WIN'
      } else if (teamBRuns > teamARuns) {
        winnerTeam = 'teamB';
        resultReason = 'CHASED';
      } else {
        winnerTeam = null;
        resultReason = 'TIE';
      }

      match.isCompleted = true;
      match.winnerTeam = winnerTeam;
      match.winnerTeamName =
        winnerTeam === 'teamA'
          ? match.teamA?.name
          : winnerTeam === 'teamB'
          ? match.teamB?.name
          : '';
      match.resultReason = resultReason;

      // push to history and clear current match
      state.history.push(match);
      state.currentMatch = null;
    },

    undoLastBall(state) {
      const match = state.currentMatch;
      if (!match) return;

      const inningsKey: 'innings1' | 'innings2' =
        match.currentInnings === 2 ? 'innings2' : 'innings1';
      const innings = match[inningsKey];
      if (!innings) return;

      if (innings.balls.length === 0) return;

      // remove last
      innings.balls.pop();

      // reset totals
      innings.totalRuns = 0;
      innings.totalWickets = 0;
      innings.totalBalls = 0;

      // reset player stats for BOTH teams (or at least current innings teams)
      const resetTeam = (t: any) => {
        t?.players?.forEach((p: any) => {
          p.runs = 0;
          p.balls = 0;
          p.fours = 0;
          p.sixes = 0;
          p.isOut = false;
          p.overs = 0;
          p.maidens = 0;
          p.conceded = 0;
          p.wickets = 0;
          p.wides = 0;
          p.noBalls = 0;
        });
      };

      resetTeam(match.teamA);
      resetTeam(match.teamB);

      // keep current striker/nonStriker/bowler as they were initially selected
      // BUT recompute their changes using your same logic:
      const savedStriker = innings.strikerId;
      const savedNonStriker = innings.nonStrikerId;
      const savedBowler = innings.bowlerId;

      // restore them
      innings.strikerId = savedStriker;
      innings.nonStrikerId = savedNonStriker;
      innings.bowlerId = savedBowler;

      // replay all balls
      const ballsCopy = [...innings.balls];
      innings.balls = [];
      ballsCopy.forEach(b => {
        // dispatching inside reducer not allowed, so just call the same logic manually is long.
        // easiest: you can create a shared function applyBall(state, payload) and call it here & in recordBall.
        // For now: just push back and re-run recordBall logic by extracting it into a helper.
      });
    },

    endMatch(state) {
      if (state.currentMatch) {
        state.history.push(state.currentMatch);
        state.currentMatch = null;
      }
    },
    clearHistory(state) {
      state.history = [];
    },
  },
});
export const {
  setmatch,
  updateMatch,
  endMatch,
  clearHistory,
  addStrikerAndBowlerInnings,
  recordBall,
  undoLastBall,
  setNextBatsman,
  setNextBowler,
  setActiveModal,
  startSecondInnings,
  completeMatchIfNeeded,
} = matchSlice.actions;
export default matchSlice.reducer;
