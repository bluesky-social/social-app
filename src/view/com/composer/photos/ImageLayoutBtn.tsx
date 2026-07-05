import {useEffect, useState} from 'react'
import {Trans, useLingui} from '@lingui/react/macro'

import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Carousel_Stroke2_Corner0_Rounded as CarouselIcon} from '#/components/icons/Carousel'
import {GridSquare2x2_Stroke2_Corner0_Rounded as GridIcon} from '#/components/icons/GridSquare'
import * as Tooltip from '#/components/Tooltip'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {useImageLayoutNudged} from '#/storage/hooks/image-layout-nudged'
import {type ImageLayout} from '../state/composer'

/**
 * Experiment (gated by `ComposerImageLayoutToggleEnable`): lets the user pick
 * how 2-4 images are displayed in the final post. `carousel` publishes the
 * images as the newer `app.bsky.embed.gallery` embed (the format used for 5+
 * images), `grid` keeps the legacy `app.bsky.embed.images` embed.
 */
export function ImageLayoutBtn({
  layout,
  imageCount,
  onChange,
}: {
  layout: ImageLayout
  imageCount: number
  onChange: (layout: ImageLayout) => void
}) {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const [imageLayoutNudged, setImageLayoutNudged] = useImageLayoutNudged()
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipWasShown] = useState(!imageLayoutNudged)

  useEffect(() => {
    if (!imageLayoutNudged) {
      const timeout = setTimeout(() => {
        setShowTooltip(true)
      }, 1000)
      return () => clearTimeout(timeout)
    }
  }, [imageLayoutNudged])

  const onDismissTooltip = (visible: boolean) => {
    if (visible) return
    setImageLayoutNudged(true)
    setShowTooltip(false)
  }

  const nextLayout: ImageLayout = layout === 'grid' ? 'carousel' : 'grid'

  const onPress = () => {
    ax.metric('composer:imageLayout:toggle', {
      layout: nextLayout,
      imageCount,
      nudged: tooltipWasShown,
    })

    setShowTooltip(false)
    setImageLayoutNudged(true)

    onChange(nextLayout)
  }

  return (
    <Tooltip.Outer
      visible={showTooltip}
      onVisibleChange={onDismissTooltip}
      position="top">
      <Tooltip.Target>
        <Button
          color={showTooltip ? 'primary_subtle' : 'secondary'}
          size="small"
          testID="imageLayoutBtn"
          onPress={onPress}
          label={
            nextLayout === 'carousel'
              ? l`Switch images to carousel layout`
              : l`Switch images to grid layout`
          }
          accessibilityHint={l`Switches how the images in your post are displayed`}>
          <ButtonIcon icon={layout === 'grid' ? GridIcon : CarouselIcon} />
          <ButtonText numberOfLines={1} maxFontSizeMultiplier={2}>
            {layout === 'grid' ? (
              <Trans context="Image layout in a post">Grid</Trans>
            ) : (
              <Trans context="Image layout in a post">Carousel</Trans>
            )}
          </ButtonText>
        </Button>
      </Tooltip.Target>
      <Tooltip.TextBubble>
        <Text>
          <Trans>
            You can now choose to display your images in the new carousel
            format.
          </Trans>
        </Text>
      </Tooltip.TextBubble>
    </Tooltip.Outer>
  )
}
