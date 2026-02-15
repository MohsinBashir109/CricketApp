import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { MatchSetup } from '../../types/Playertype';

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
export const { setmatch, updateMatch, endMatch, clearHistory } =
  matchSlice.actions;
export default matchSlice.reducer;
