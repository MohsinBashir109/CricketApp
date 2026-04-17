import React, { useMemo } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import AddPlayersToTeamScreen from './AddPlayersToTeamScreen';
import type { Player } from '../../../types/Playertype';
import {
  matchPlayersToSquad,
  squadPlayersToMatchPlayers,
} from './matchSquadAdapters';
import { routes } from '../../../utils/routes';

export type AddPlayersToTeamRouteParams = {
  teamKey: 'teamA' | 'teamB';
  teamDisplayName: string;
  initialPlayers: Player[];
};

const AddPlayersToTeamRoute: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = route.params as AddPlayersToTeamRouteParams | undefined;

  const teamDisplayName = params?.teamDisplayName ?? 'Team';
  const initialSquad = useMemo(
    () => matchPlayersToSquad(params?.initialPlayers ?? []),
    [params?.initialPlayers],
  );

  if (!params?.teamKey) {
    return (
      <AddPlayersToTeamScreen
        teamDisplayName={teamDisplayName}
        initialPlayers={[]}
        onBack={() => navigation.goBack()}
      />
    );
  }

  return (
    <AddPlayersToTeamScreen
      teamDisplayName={teamDisplayName}
      initialPlayers={initialSquad}
      onBack={() => navigation.goBack()}
      onSaveTeam={squad => {
        const players = squadPlayersToMatchPlayers(squad);
        // IMPORTANT: go back first so we don't push a new StartMatch screen,
        // otherwise the pager remounts and resets to step 0 (overs).
        navigation.goBack();
        requestAnimationFrame(() => {
          navigation.navigate({
            name: routes.startMatch,
            params: {
              squadForTeam: { teamKey: params.teamKey, players },
            },
            merge: true,
          });
        });
      }}
    />
  );
};

export default AddPlayersToTeamRoute;
