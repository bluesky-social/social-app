import {useCallback} from 'react'
import {type GestureResponderEvent, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {HITSLOP_30} from '#/lib/constants'
import {type NavigationProp} from '#/lib/routes/types'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useFeedSourceInfoQuery} from '#/state/queries/feed'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {type VideoFeedSourceContext} from '#/screens/VideoFeed/types'
import {atoms as a, useBreakpoints} from '#/alf'
import {Button, type ButtonProps} from '#/components/Button'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft} from '#/components/icons/Arrow'
import * as Layout from '#/components/Layout'
import {BUTTON_VISUAL_ALIGNMENT_OFFSET} from '#/components/Layout/const'
import {Text} from '#/components/Typography'

export function HeaderPlaceholder() {
  return (
    <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
      <View
        style={[
          a.rounded_sm,
          {
            width: 36,
            height: 36,
            backgroundColor: 'white',
            opacity: 0.8,
          },
        ]}
      />

      <View style={[a.flex_1, a.gap_xs]}>
        <View
          style={[
            a.w_full,
            a.rounded_xs,
            {
              backgroundColor: 'white',
              height: 14,
              width: 80,
              opacity: 0.8,
            },
          ]}
        />
        <View
          style={[
            a.w_full,
            a.rounded_xs,
            {
              backgroundColor: 'white',
              height: 10,
              width: 140,
              opacity: 0.6,
            },
          ]}
        />
      </View>
    </View>
  )
}

export function Header({
  sourceContext,
}: {
  sourceContext: VideoFeedSourceContext
}) {
  let content = null
  switch (sourceContext.type) {
    case 'feedgen': {
      content = <FeedHeader sourceContext={sourceContext} />
      break
    }
    case 'author':
    // TODO
    default: {
      break
    }
  }

  return (
    <Layout.Header.Outer noBottomBorder>
      <BackButton />
      <Layout.Header.Content align="left">{content}</Layout.Header.Content>
    </Layout.Header.Outer>
  )
}

export function FeedHeader({
  sourceContext,
}: {
  sourceContext: Exclude<VideoFeedSourceContext, {type: 'author'}>
}) {
  const {gtMobile} = useBreakpoints()

  const {
    data: info,
    isLoading,
    error,
  } = useFeedSourceInfoQuery({uri: sourceContext.uri})

  if (sourceContext.sourceInterstitial !== undefined) {
    // For now, don't show the header if coming from an interstitial.
    return null
  }

  if (isLoading) {
    return <HeaderPlaceholder />
  } else if (error || !info) {
    return null
  }

  return (
    <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
      {info.avatar && <UserAvatar size={36} type="algo" avatar={info.avatar} />}

      <View style={[a.flex_1]}>
        <Text
          style={[
            a.text_md,
            a.font_bold,
            a.leading_tight,
            gtMobile && a.text_lg,
          ]}
          numberOfLines={2}>
          {info.displayName}
        </Text>
        <View style={[a.flex_row, {gap: 6}]}>
          <Text
            style={[a.flex_shrink, a.text_sm, a.leading_snug]}
            numberOfLines={1}>
            {sanitizeHandle(info.creatorHandle, '@')}
          </Text>
        </View>
      </View>
    </View>
  )
}

// TODO: This customization should be a part of the layout component
export function BackButton({onPress, style, ...props}: Partial<ButtonProps>) {
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()

  const onPressBack = useCallback(
    (evt: GestureResponderEvent) => {
      onPress?.(evt)
      if (evt.defaultPrevented) return
      if (navigation.canGoBack()) {
        navigation.goBack()
      } else {
        navigation.navigate('Home')
      }
    },
    [onPress, navigation],
  )

  return (
    <Layout.Header.Slot>
      <Button
        label={_(msg`Go back`)}
        size="small"
        variant="ghost"
        color="secondary"
        shape="round"
        onPress={onPressBack}
        hitSlop={HITSLOP_30}
        style={[
          {marginLeft: -BUTTON_VISUAL_ALIGNMENT_OFFSET},
          a.bg_transparent,
          style,
        ]}
        {...props}>
        <ArrowLeft size="lg" fill="white" />
      </Button>
    </Layout.Header.Slot>
  )
}
