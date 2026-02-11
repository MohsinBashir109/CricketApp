import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import HomeWrapper from '../../../wrappers/HomeWrapper'
import StartMatchPager from '../../../components/Pager/StartMatchPager'
import StartmatchHeader from '../../../components/Headers/StartmatchHeader'

const StartMatch = () => {
  return (
    <HomeWrapper headerShown={false}>
        
    <View style={styles.container}>
      
       <StartMatchPager />
      
    </View>
    </HomeWrapper>
  )
}

export default StartMatch

const styles = StyleSheet.create({
    container: { flex: 1, width: '100%' },
})