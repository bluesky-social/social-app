import React from 'react'
import {useTourGuideController} from 'rn-tourguide'

import {Button, ButtonText} from '#/components/Button'

export function TourDebugButton() {
  const {start} = useTourGuideController('home')
  return (
    <Button
      onPress={() => {
        console.log('firing')
        start(1)
      }}>
      <ButtonText>t</ButtonText>
    </Button>
  )
}
