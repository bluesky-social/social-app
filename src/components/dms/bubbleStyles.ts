import {type ViewStyle} from 'react-native'

import {type Theme} from '#/alf'
import {atoms as a, platform} from '#/alf'
import {BUBBLE_RADIUS, BUBBLE_RADIUS_SHARP} from './util'

/**
 * Calculates border radius for message bubbles based on cluster position.
 * Sharpens the corners on the sender's side when messages are clustered.
 */
export function getBubbleRadii({
  isIncoming,
  isFirstInCluster,
  isLastInCluster,
  hasEmbedAndText = false,
}: {
  isIncoming: boolean
  isFirstInCluster: boolean
  isLastInCluster: boolean
  hasEmbedAndText?: boolean
}): ViewStyle {
  const sharpTop = !isFirstInCluster || hasEmbedAndText
  const sharpBottom = !isLastInCluster

  return isIncoming
    ? {
        borderTopLeftRadius: sharpTop ? BUBBLE_RADIUS_SHARP : BUBBLE_RADIUS,
        borderBottomLeftRadius: sharpBottom
          ? BUBBLE_RADIUS_SHARP
          : BUBBLE_RADIUS,
        borderTopRightRadius: BUBBLE_RADIUS,
        borderBottomRightRadius: BUBBLE_RADIUS,
      }
    : {
        borderTopLeftRadius: BUBBLE_RADIUS,
        borderBottomLeftRadius: BUBBLE_RADIUS,
        borderTopRightRadius: sharpTop ? BUBBLE_RADIUS_SHARP : BUBBLE_RADIUS,
        borderBottomRightRadius: sharpBottom
          ? BUBBLE_RADIUS_SHARP
          : BUBBLE_RADIUS,
      }
}

/**
 * Platform-specific outer margin for message bubbles.
 * Keeps bubbles aligned properly across different platforms.
 */
export function getMessageInset({
  isIncoming,
  isGroupChat,
}: {
  isIncoming: boolean
  isGroupChat: boolean
}): ViewStyle | undefined {
  return platform<ViewStyle | undefined>({
    ios: !isIncoming ? a.mr_md : isGroupChat ? a.ml_md : a.ml_sm,
    android: !isIncoming ? a.mr_sm : isGroupChat ? a.ml_sm : undefined,
    web: !isIncoming ? a.mr_sm : isGroupChat ? a.ml_sm : undefined,
  })
}

/**
 * Determines bubble background color based on message state.
 * Real messages use primary/contrast colors; skeleton placeholders use lighter shades.
 */
export function getBubbleColor(
  t: Theme,
  {
    isIncoming,
    isPending = false,
    isRealMessage = true,
  }: {
    isIncoming: boolean
    isPending?: boolean
    isRealMessage?: boolean
  },
): string {
  if (isRealMessage) {
    return isIncoming
      ? t.palette.contrast_50
      : isPending
        ? t.palette.primary_300
        : t.palette.primary_500
  }

  // Skeleton/placeholder colors
  return isIncoming ? t.palette.contrast_50 : t.palette.primary_100
}
