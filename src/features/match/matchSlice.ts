import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
  MatchSetup,
  Player,
  SetOpenersAndBowlerPayload,
} from '../../types/Playertype';

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
} = matchSlice.actions;
export default matchSlice.reducer;
