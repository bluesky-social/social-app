import React from 'react'
import {useAvatar} from '#/screens/Onboarding/StepProfile/index'
import ViewShot from 'react-native-view-shot'
import {StyleSheet, View} from 'react-native'

// This component is supposed to be invisible to the user. We only need this for ViewShot to have something to
// "screenshot"
export const PlaceholderCanvas = React.forwardRef(function PlaceholderCanvas(
  {},
  ref,
) {
  const avatar = useAvatar()
  const viewshotRef = React.useRef()
  const Icon = avatar.placeholder.component

  // React.useEffect(() => {
  //   // @ts-ignore this library doesn't have types
  //   viewshotRef.current.capture().then(uri => {
  //     return uri
  //   })
  // }, [avatar, ref])

  return (
    <View style={styles.imageContainer}>
      <ViewShot
        ref={viewshotRef}
        options={{fileName: 'placeholderAvatar', format: 'jpg', quality: 1.0}}>
        <View
          style={[{backgroundColor: avatar.backgroundColor}]}
          collapsable={false}>
          <Icon height={500} width={500} style={{color: 'white'}} />
        </View>
      </ViewShot>
    </View>
  )
})

const styles = StyleSheet.create({
  imageContainer: {
    top: 100,
    position: 'absolute',
    zIndex: -5,
  },
})
