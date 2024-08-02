import React, {useCallback, useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'
import {ErrorBoundary} from '../ErrorBoundary'
import {useActiveVideoView} from './ActiveVideoContext'
import {VideoEmbedInner} from './VideoEmbedInner'
import {HLSUnsupportedError} from './VideoEmbedInner.web'

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

  const [key, setKey] = useState(0)
  const renderError = useCallback(
    (error: unknown) => (
      <VideoError error={error} retry={() => setKey(key + 1)} />
    ),
    [key],
  )

  console.log(key)

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
        style={{display: 'flex', flex: 1, cursor: 'default'}}
        onClick={evt => evt.stopPropagation()}>
        <ErrorBoundary renderError={renderError} key={key}>
          <VideoEmbedInner
            source={source}
            active={active}
            setActive={setActive}
            sendPosition={sendPosition}
            onScreen={onScreen}
            isAnyViewActive={currentActiveView !== null}
          />
        </ErrorBoundary>
      </div>
    </View>
  )
}

function VideoError({error, retry}: {error: unknown; retry: () => void}) {
  const t = useTheme()
  const {_} = useLingui()

  const isHLS = error instanceof HLSUnsupportedError

  return (
    <View
      style={[
        a.flex_1,
        t.atoms.bg_contrast_25,
        a.justify_center,
        a.align_center,
        a.px_lg,
        a.border,
        t.atoms.border_contrast_low,
        a.rounded_sm,
        a.gap_lg,
      ]}>
      <Text
        style={[
          a.text_center,
          t.atoms.text_contrast_high,
          a.text_md,
          a.leading_snug,
          {maxWidth: 300},
        ]}>
        {isHLS ? (
          <Trans>
            Your browser does not support the video format. Please try a
            different browser.
          </Trans>
        ) : (
          <Trans>
            An error occurred while loading the video. Please try again later.
          </Trans>
        )}
      </Text>
      {!isHLS && (
        <Button
          onPress={retry}
          size="small"
          color="secondary_inverted"
          variant="solid"
          label={_(msg`Retry`)}>
          <ButtonText>
            <Trans>Retry</Trans>
          </ButtonText>
        </Button>
      )}
    </View>
  )
}
