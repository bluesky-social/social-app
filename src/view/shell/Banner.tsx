import {Image, StyleSheet, View} from 'react-native'

import React from 'react'
import {SolarplexLogo} from 'lib/icons'

export const Banner = () => {
  return (
    <View style={bannerStyles.container}>
      {/* <Image
        source={require('./banner.png')}
        style={bannerStyles.backgroundImage}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      /> */}
      <SolarplexLogo />
    </View>
  )
}

const bannerStyles = StyleSheet.create({
  container: {
    marginBottom: 10,
    flex: 1,
    position: 'relative',
    width: '100%',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    zIndex: -1,
    width: '100%',
    height: 80,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  logo: {
    width: 200,
    height: 200,
    marginLeft: 20,
  },
})
