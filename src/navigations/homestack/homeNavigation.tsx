import * as Home from '../../screens/HomeStack/HomeStack';

import React, { useEffect, useRef } from 'react';
import {
  getHistoryFromFirestore,
  saveHistoryToFirestore,
} from '../../services/history';
import { useDispatch, useSelector } from 'react-redux';

import { BottomTabs } from './bottomNavigation';
import { RootState } from '../../features/store/rootReducer';
import { auth } from '../../dbConfig/firebase';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { routes } from '../../utils/routes';
import { setHistory } from '../../features/match/matchSlice';

const HomeStack = createNativeStackNavigator();

export const HomeNavigation = () => {
  const history = useSelector((state: RootState) => state.match.history);
  const dispatch = useDispatch();

  const hasLoadedHistoryRef = useRef(false);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const firestoreHistory = await getHistoryFromFirestore(user);
        dispatch(setHistory(firestoreHistory));

        hasLoadedHistoryRef.current = true;
        console.log('History loaded from Firestore', firestoreHistory);
      } catch (error) {
        console.log('History load error:', error);
      }
    };

    loadHistory();
  }, [dispatch]);

  useEffect(() => {
    if (!hasLoadedHistoryRef.current) return;

    const user = auth.currentUser;
    if (!user) return;

    const syncHistory = async () => {
      try {
        await saveHistoryToFirestore(history);
        console.log('History synced to Firestore');
      } catch (error) {
        console.log('History sync error:', error);
      }
    };

    syncHistory();
  }, [history]);

  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={routes.myTabs}
    >
      <HomeStack.Screen name={routes.myTabs} component={BottomTabs} />
      <HomeStack.Screen
        name={routes.createTournament}
        component={Home.CreateTournamentScreen}
      />
      <HomeStack.Screen
        name={routes.tournamentDetails}
        component={Home.TournamentDetailsScreen}
      />
      <HomeStack.Screen name={routes.startMatch} component={Home.Startmatch} />
      <HomeStack.Screen
        name={routes.addPlayersToTeam}
        component={Home.AddPlayersToTeamRoute}
      />
      <HomeStack.Screen
        name={routes.matchsummary}
        component={Home.MatchSummary}
      />
      <HomeStack.Screen
        name={routes.matchscoring}
        component={Home.MatchScoring}
      />
      <HomeStack.Screen
        name={routes.matchHistory}
        component={Home.MatchHistoryScreen}
      />
    </HomeStack.Navigator>
  );
};
