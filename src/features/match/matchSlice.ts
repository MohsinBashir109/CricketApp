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
      state.currentMatch = action.payload;
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

    recordBall(
      state,
      action: PayloadAction<{
        runsOffBat?: 0 | 1 | 2 | 3 | 4 | 6;
        extra?: 'wide' | 'noball' | 'bye' | 'legbye' | null;
        extraRuns?: number; // default 1 for wide/noball, user enters for bye/legbye
        wicket?: boolean;
      }>,
    ) {
      const match = state.currentMatch;
      if (!match) return;

      const inningsKey: 'innings1' | 'innings2' =
        match.currentInnings === 2 ? 'innings2' : 'innings1';
      const innings = match[inningsKey];
      if (!innings) return;

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

      // Legal ball? (wide/noBall are NOT legal)
      const isLegal = !isWide && !isNoBall;

      // Total runs that go to TEAM SCORE for this delivery
      // - normal: runsOffBat
      // - wide/noBall: extraRuns + runsOffBat (if you allow bat on noBall)
      // - bye/legbye: extraRuns (runsOffBat should be 0)
      const totalRuns = isBye || isLegBye ? extraRuns : runsOffBat + extraRuns;

      // Build Ball object
      const legalBallNumber = innings.totalBalls + 1; // only meaningful if legal
      const over = Math.floor(innings.totalBalls / 6) + 1;
      const ballInOver = (innings.totalBalls % 6) + 1;

      const newBall = {
        ballNumber: innings.balls.length + 1,
        over,
        ballInOver: isLegal ? ballInOver : 0, // 0 for non-legal deliveries
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

      if (action.payload.wicket) {
        innings.totalWickets += 1;

        // who is out (default striker for now)
        const outTarget: 'STRIKER' | 'NON_STRIKER' =
          innings.outTarget ?? 'STRIKER';

        const outId =
          outTarget === 'STRIKER' ? innings.strikerId : innings.nonStrikerId;

        // mark out in batting team
        if (outId != null) {
          const outPlayer = batTeam.players.find(p => p.id === outId);
          if (outPlayer) outPlayer.isOut = true;
        }

        // remove from crease so UI will force selection
        if (outTarget === 'STRIKER') innings.strikerId = null;
        else innings.nonStrikerId = null;

        // open next batsman modal
        innings.activeModal = 'NEXT_BATSMAN';
        innings.outTarget = outTarget;

        // ✅ if wicket happened on end of over, show bowler modal AFTER batsman selected
        // NOTE: this check should use current totalBalls BEFORE you increment it below
        const willEndOver = isLegal && (innings.totalBalls + 1) % 6 === 0;
        if (willEndOver) {
          innings.pendingBowlerChange = true;
        }
      }

      // Update batsman stats
      // Balls faced only on LEGAL balls, and byes/legbyes still count as balls faced
      if (isLegal) {
        striker.balls = (striker.balls ?? 0) + 1;
      }

      // Runs to batsman only when NOT bye/legbye
      if (!isBye && !isLegBye) {
        striker.runs = (striker.runs ?? 0) + runsOffBat;
        if (runsOffBat === 4) striker.fours = (striker.fours ?? 0) + 1;
        if (runsOffBat === 6) striker.sixes = (striker.sixes ?? 0) + 1;
      }

      // Update bowler stats
      bowler.conceded = (bowler.conceded ?? 0) + totalRuns;
      if (isWide) bowler.wides = (bowler.wides ?? 0) + extraRuns;
      if (isNoBall) bowler.noBalls = (bowler.noBalls ?? 0) + extraRuns;

      if (action.payload.wicket) {
        bowler.wickets = (bowler.wickets ?? 0) + 1;
      }

      // Overs increment only on legal balls
      if (isLegal) {
        const prevBalls = oversToBalls(bowler.overs);
        bowler.overs = ballsToOvers(prevBalls + 1);
        innings.totalBalls += 1;
      }

      // Strike rotation:
      // - If totalRuns odd => swap strike (even on wides/noBalls it can happen)
      if (totalRuns % 2 === 1) {
        const tmp = innings.strikerId;
        innings.strikerId = innings.nonStrikerId;
        innings.nonStrikerId = tmp;
      }

      // End of over auto-swap (after a LEGAL 6th ball)
      if (isLegal && innings.totalBalls % 6 === 0) {
        // swap strike at over end
        const tmp = innings.strikerId;
        innings.strikerId = innings.nonStrikerId;
        innings.nonStrikerId = tmp;

        // force bowler selection
        innings.bowlerId = null;

        // if wicket already opened batsman modal (wicket on 6th ball),
        // show bowler after batsman is selected
        if (innings.activeModal === 'NEXT_BATSMAN') {
          innings.pendingBowlerChange = true;
        } else {
          innings.activeModal = 'NEXT_BOWLER';
        }
      }
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
} = matchSlice.actions;
export default matchSlice.reducer;
