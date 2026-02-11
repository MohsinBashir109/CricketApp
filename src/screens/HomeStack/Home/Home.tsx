import { CommonActions, useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../../../components/themeButton';
import React from 'react';
import { handleSignOut } from '../../../services/authServices';
import { routes } from '../../../utils/routes';

export default function Home() {
  const navigation = useNavigation<any>();

  const handleLogout = async () => {
    const res = await handleSignOut();

    if (res?.ok) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: routes.auth }], // OR routes.authStack (see note below)
        }),
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text>Home</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
