import { Image, StyleSheet, Text, View } from "react-native"
import ThemeText from "../ThemeText"
import { fontFamilies } from "../../utils/fontfamilies"
import { fontPixel, heightPixel, widthPixel } from "../../utils/constants"


export const UserHeader = () => {
    return (
        <View style={styles.container}>
          <View>
              <ThemeText style={styles.headerText} color="text">Welcome Player</ThemeText>
              <ThemeText style={styles.headerText2} color="text">Jhon Doe</ThemeText>
          </View>
          <View style={{ flex : 1 }}/>
          <View>
            <Image
                source={undefined}
                style={{width:widthPixel(50),height:heightPixel(50),borderRadius:25,backgroundColor:'gray'}}/>
          </View>
        </View>
    )
}
const styles = StyleSheet.create({
    container :{
        paddingTop : heightPixel(10),
        flexDirection:'row',
        justifyContent:'flex-start',
        alignItems:'center',
        
        width:'100%',
       
        

    },
    headerText :{
        fontFamily:fontFamilies.semibold,
        fontSize:fontPixel(16)
    },
     headerText2 :{
        fontFamily:fontFamilies.bold,
        fontSize:fontPixel(24)
    }
})