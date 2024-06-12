import React from 'react'
import {View} from 'react-native'

import {isWeb} from '#/platform/detection'
import {Nudge} from '#/components/Nudge'
import {Text} from '#/components/Typography'

export function HomeNewUserNudge() {
  const [isOpen, setIsOpen] = React.useState(true)
  return (
    <Nudge
      isOpen={isOpen}
      anchor="top_center"
      onClose={() => setIsOpen(false)}
      style={
        isWeb
          ? {
              left: '50%',
              top: 105,
              maxWidth: 380,
              transform: [{translateX: '-50%'}],
            }
          : {
              top: 155,
              left: 10,
              right: 10,
            }
      }>
      <View
        style={{
          paddingTop: 10,
          paddingBottom: 20,
          paddingHorizontal: 10,
          gap: 10,
        }}>
        <Text
          style={{
            fontWeight: 'bold',
            fontSize: 21,
            lineHeight: 23,
            color: '#fff',
          }}>
          Welcome to Bluesky!
        </Text>
        <Text
          style={{
            fontWeight: '500',
            fontSize: 16,
            lineHeight: 18,
            color: '#fff',
          }}>
          You're on the Discover algorithm. Swipe right to change your current
          feed.
        </Text>
      </View>
    </Nudge>
  )
}
