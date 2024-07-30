import React, {useCallback, useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Play_Filled_Corner2_Rounded as PlayIcon} from '#/components/icons/Play'
import {useActiveVideoView} from './ActiveVideoContext'
import {VideoEmbedInner} from './VideoEmbedInner'

export function VideoEmbed({source}: {source: string}) {
  const t = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  const {active, setActive, sendPosition, currentActiveView} =
    useActiveVideoView({
      source,
    })
  const [onScreen, setOnScreen] = useState(false)
  const [hasBeenOnScreen, setHasBeenOnScreen] = useState(false)
  const {_} = useLingui()

  const onPress = useCallback(() => setActive(), [setActive])

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (!entry) return
        setOnScreen(entry.isIntersecting)
        if (entry.isIntersecting) {
          setHasBeenOnScreen(true)
        }
        sendPosition(
          entry.boundingClientRect.y + entry.boundingClientRect.height / 2,
        )
      },
      {threshold: 0.5},
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [sendPosition])

  return (
    <View
      style={[
        a.w_full,
        {aspectRatio: 16 / 9},
        t.atoms.bg_contrast_25,
        a.rounded_sm,
        a.my_xs,
      ]}>
      <div ref={ref} style={{display: 'flex', flex: 1}}>
        {hasBeenOnScreen || active ? (
          <VideoEmbedInner
            source={source}
            active={active}
            setActive={setActive}
            sendPosition={sendPosition}
            onScreen={onScreen}
            isAnyViewActive={currentActiveView !== null}
          />
        ) : (
          <Button
            style={[a.flex_1, t.atoms.bg_contrast_25, a.rounded_sm]}
            onPress={onPress}
            label={_(msg`Play video`)}
            variant="ghost"
            color="secondary"
            size="large">
            <ButtonIcon icon={PlayIcon} />
          </Button>
        )}
      </div>
    </View>
  )
}
