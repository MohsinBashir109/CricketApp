import { RESET_ALL } from '../auth/authSlice';
import authReducer from '../auth/authSlice';
import { combineReducers } from 'redux';
import matchReducer from '../match/matchSlice';

const appReducer = combineReducers({
  auth: authReducer,
  match: matchReducer,
});
const rootReducer = (state: any, action: any) => {
  if (action.type === RESET_ALL) {
    // Reset the whole state (set to undefined → reducers return their initial state)
    state = undefined;
  }
  return appReducer(state, action);
};
export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
