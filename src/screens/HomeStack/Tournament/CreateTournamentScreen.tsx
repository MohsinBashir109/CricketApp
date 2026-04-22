import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import HomeWrapper from '../../../wrappers/HomeWrapper';
import CreateTournamentFlow from '../../../components/Tournament/CreateTournamentFlow';
import { heightPixel, widthPixel } from '../../../utils/constants';

/**
 * Standalone route for deep links / legacy navigation.
 * Tournament Center uses the same flow inline.
 */
const CreateTournamentScreen = ({ navigation }: any) => {
  return (
    <HomeWrapper headerShown>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View>
          <CreateTournamentFlow
            navigation={navigation}
            expanded
            onCollapse={() => navigation.goBack()}
          />
        </View>
      </ScrollView>
    </HomeWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: widthPixel(16),
    paddingTop: heightPixel(18),
    paddingBottom: heightPixel(36),
  },
});

export default CreateTournamentScreen;
