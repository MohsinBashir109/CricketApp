import PagerView from 'react-native-pager-view';
import { StyleSheet, Text, View } from 'react-native'
import React ,{useRef,useState}from 'react'


import { useNavigation } from '@react-navigation/native';
import OverSelection from '../Flatlistcomponents/OverSelection';
import StartmatchHeader from '../Headers/StartmatchHeader';


const StartMatchPager = () => {
    const navigation = useNavigation<any>();
    const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);
console.log('Current page:', page);
  const pageTittle = (page : number) =>{
    switch(page){
        case 0 : return "Select the number of overs";
        case 1 : return "Page 2";
        case 2 : return "Page 3";
        default : return "Select the number of overs"
    }

  }
  
  const onBack = () => {
    if(page>0){
        pagerRef.current?.setPage(page-1);
    } else {
        navigation.goBack();
    }
}
 
  return (
    <View style={{ flex: 1 }}>
    <StartmatchHeader title={pageTittle(page)} onBack={onBack}/>
    <PagerView style={[styles.pagerView,]} 
    initialPage={0} 
    ref={pagerRef} 
    scrollEnabled={false}
     onPageSelected={(e) => setPage(e.nativeEvent.position)}>
      <View key="1" style={styles.page}>
    <OverSelection onSelect={(overs) => {
    console.log('Selected overs:', overs);
    pagerRef.current?.setPage(1);
  }}/>     
      </View>
      <View key="2" style={styles.page}>
        <Text style={styles.pageText}>Page 2</Text>
      </View>
      <View key="3" style={styles.page}>
        <Text style={styles.pageText}>Page 3</Text>
      </View>

    </PagerView>
    </View>
  )
}

export default StartMatchPager

const styles = StyleSheet.create({

     pagerView: {
    flex: 1,
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  pageText: {
    fontSize: 20,
  },
})