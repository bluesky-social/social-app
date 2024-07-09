import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {
  IStep,
  TourGuideZone,
  TourGuideZoneByPosition,
  useTourGuideController,
} from 'rn-tourguide'

import {DISCOVER_FEED_URI} from '#/lib/constants'
import {isWeb} from '#/platform/detection'
import {useSetSelectedFeed} from '#/state/shell/selected-feed'
import {TOURS} from '.'
import {useHeaderPosition} from './positioning'

export function HomeTour() {
  const {_} = useLingui()
  const {tourKey, eventEmitter} = useTourGuideController(TOURS.HOME)
  const setSelectedFeed = useSetSelectedFeed()
  const headerPosition = useHeaderPosition()

  React.useEffect(() => {
    const handleOnStepChange = (step?: IStep) => {
      if (step?.order === 2) {
        setSelectedFeed('following')
      } else if (step?.order === 3) {
        setSelectedFeed(`feedgen|${DISCOVER_FEED_URI}`)
      }
    }
    eventEmitter?.on('stepChange', handleOnStepChange)
    return () => {
      eventEmitter?.off('stepChange', handleOnStepChange)
    }
  }, [eventEmitter, setSelectedFeed])

  return (
    <>
      <TourGuideZoneByPosition
        isTourGuide
        tourKey={tourKey}
        zone={1}
        top={headerPosition.top}
        left={headerPosition.left}
        width={headerPosition.width}
        height={headerPosition.height}
        borderRadiusObject={headerPosition.borderRadiusObject}
        text={_(msg`Switch between feeds to control your experience.`)}
      />
      <TourGuideZoneByPosition
        isTourGuide
        tourKey={tourKey}
        zone={2}
        top={headerPosition.top}
        left={headerPosition.left}
        width={headerPosition.width}
        height={headerPosition.height}
        borderRadiusObject={headerPosition.borderRadiusObject}
        text={_(msg`Following shows the latest posts from people you follow.`)}
      />
      <TourGuideZoneByPosition
        isTourGuide
        tourKey={tourKey}
        zone={3}
        top={headerPosition.top}
        left={headerPosition.left}
        width={headerPosition.width}
        height={headerPosition.height}
        borderRadiusObject={headerPosition.borderRadiusObject}
        text={_(msg`Discover learns which posts you like as you browse.`)}
      />
    </>
  )
}

export function HomeTourExploreWrapper({
  children,
}: React.PropsWithChildren<{}>) {
  const {_} = useLingui()
  const {tourKey} = useTourGuideController(TOURS.HOME)
  return (
    <TourGuideZone
      tourKey={tourKey}
      zone={4}
      tooltipBottomOffset={50}
      shape={isWeb ? 'rectangle' : 'circle'}
      text={_(
        msg`Find more feeds and accounts to follow in the Explore page.`,
      )}>
      {children}
    </TourGuideZone>
  )
}
