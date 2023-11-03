import React, {useEffect} from 'react'
import {Image} from 'expo-image'
// import {Image} from 'react-native'
import * as SplashScreen from 'expo-splash-screen'

SplashScreen.preventAutoHideAsync()

export default function App() {
  // init
  useEffect(() => {
    SplashScreen.hideAsync()
    console.log('hiding splash')
  }, [])

  return (
    <Image
      style={{
        flex: 1,
      }}
      source={{
        uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/IMO_9811000_EVER_GIVEN_%2809%29.JPG/800px-IMO_9811000_EVER_GIVEN_%2809%29.JPG',
      }}
    />
  )
}
