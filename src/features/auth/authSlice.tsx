import { AuthState, AuthUser } from '../../types/AuthTypes';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export const RESET_ALL = 'RESET_ALL';
export const resetAll = () => ({ type: RESET_ALL });
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setuser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearuser(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setuser, clearuser } = authSlice.actions;
export default authSlice.reducer;
