import React, {useEffect, useRef, useState} from 'react'
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
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

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (!entry) return
        setOnScreen(entry.isIntersecting)
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
      <div
        ref={ref}
        style={{display: 'flex', flex: 1}}
        onClick={evt => evt.stopPropagation()}>
        <VideoEmbedInner
          source={source}
          active={active}
          setActive={setActive}
          sendPosition={sendPosition}
          onScreen={onScreen}
          isAnyViewActive={currentActiveView !== null}
        />
      </div>
    </View>
  )
}
