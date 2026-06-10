import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Image} from 'expo-image'
import {type ThemeName} from '@bsky.app/alf'
import {Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {
  atoms as a,
  native,
  platform,
  type TextStyleProp,
  useTheme,
  web,
} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useNuxDialogContext} from '#/components/dialogs/nuxs'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Group3_Stroke2_Corner0_Rounded as GroupIcon} from '#/components/icons/Group'
import {Shield_Stroke2_Corner0_Rounded as ShieldIcon} from '#/components/icons/Shield'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {Text} from '#/components/Typography'
import {IS_E2E, IS_WEB} from '#/env'
import {createIsEnabledCheck, isExistingUserAsOf} from './utils'

// Gate: only show to existing users (created before 2026-06-11), not E2E
export const enabled = createIsEnabledCheck(props => {
  return (
    !IS_E2E &&
    isExistingUserAsOf(
      '2026-06-11T00:00:00.000Z',
      props.currentProfile.createdAt,
    )
  )
})

function getHero(theme: ThemeName) {
  switch (theme) {
    case 'light':
      return require('../../../../assets/images/groupchats_announcement_light.webp')
    case 'dark':
      return require('../../../../assets/images/groupchats_announcement_dark.webp')
    case 'dim':
      return require('../../../../assets/images/groupchats_announcement_dim.webp')
  }
}

export function GroupChatsAnnouncement() {
  const t = useTheme()
  const {t: l} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const nuxDialogs = useNuxDialogContext()
  const control = Dialog.useDialogControl()
  const {bottom} = useSafeAreaInsets()

  // Measure the footer so the scrollable content can pad itself out from
  // underneath it (the footer is absolutely positioned).
  const [footerHeight, setFooterHeight] = useState(
    platform({
      native: 124 + bottom,
      web: 128,
      default: 0,
    }),
  )

  Dialog.useAutoOpen(control)

  const onClose = useCallback(() => {
    nuxDialogs.dismissActiveNux()
  }, [nuxDialogs])

  const onPressStartGroupChat = useCallback(() => {
    control.close(() => {
      if (IS_WEB) {
        navigation.navigate('Messages', {pushToNewGroupChat: true})
      } else {
        // On native, Messages is nested inside MessagesTab.
        // @ts-expect-error nested navigators aren't typed -sfn
        navigation.navigate('MessagesTab', {
          screen: 'Messages',
          params: {pushToNewGroupChat: true},
        })
      }
    })
  }, [control, navigation])

  return (
    <Dialog.Outer
      control={control}
      onClose={onClose}
      nativeOptions={{fullHeight: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        showsVerticalScrollIndicator={false}
        label={l`Introducing group chats`}
        // Fill the full-height sheet so the absolute footer pins to the bottom.
        style={[
          native(a.h_full),
          web([{maxWidth: 440}, a.overflow_hidden, {borderRadius: 32}]),
        ]}
        contentContainerStyle={[
          native(a.p_0),
          web(a.p_md),
          {paddingBottom: footerHeight},
        ]}
        footer={
          <Dialog.FlatListFooter
            onLayout={evt => setFooterHeight(evt.nativeEvent.layout.height)}
            border={false}>
            <View
              style={[
                a.gap_md,
                native(a.px_lg),
                web([a.px_lg, a.pb_2xl, a.pt_xl]),
              ]}>
              <Button
                label={l`Got it`}
                size="large"
                color="primary"
                onPress={() => control.close()}>
                <ButtonText>
                  <Trans>Got it</Trans>
                </ButtonText>
              </Button>
              <Button
                label={l`Start a group chat`}
                size="large"
                color="secondary"
                onPress={onPressStartGroupChat}>
                <ButtonText>
                  <Trans>Start a group chat</Trans>
                </ButtonText>
              </Button>
            </View>
          </Dialog.FlatListFooter>
        }>
        <View
          style={[
            a.w_full,
            platform({
              web: [a.pt_xl, a.px_4xl],
              native: [a.pt_xl, a.pb_md, a.px_sm],
            }),
          ]}>
          <Image
            accessibilityIgnoresInvertColors
            source={getHero(t.name)}
            style={[a.w_full, {aspectRatio: 343 / 230}]}
            alt={l({
              message: `Four message bubbles representing a group chat. First message: "Did you hear the news? Bluesky has group chats now!" Second message: "omg, no way" Third message: "Wow, 50 people in one chat!" Fourth message: "You can send invite links too!"`,
              comment:
                'This is alt text for a marketing image which transcribes English text that appears in the image',
            })}
            useAppleWebpCodec
          />
        </View>
        <View style={[a.px_xl, a.pt_2xl, a.gap_2xl]}>
          <View style={[a.align_center, a.gap_sm]}>
            <View style={[a.flex_row, a.align_center, a.gap_xs]}>
              <SparkleIcon fill={t.palette.primary_500} size="sm" />
              <Text
                style={[
                  a.text_sm,
                  a.font_medium,
                  {color: t.palette.primary_500},
                ]}>
                <Trans>New</Trans>
              </Text>
            </View>
            <Text
              style={[
                a.text_center,
                a.font_bold,
                a.leading_tight,
                {fontSize: IS_WEB ? 32 : 36},
              ]}>
              <Trans>Group Chats</Trans>
            </Text>
            <Text style={[a.text_md, a.text_center]}>
              <Trans>Take the conversation private.</Trans>
            </Text>
          </View>

          <View style={[a.gap_xl, a.pt_sm, a.pb_md]}>
            <Feature
              icon={ChainLinkIcon}
              titleText={<Trans>Add people with a link</Trans>}
              descriptionText={
                <Trans>Post it to Bluesky or share anywhere.</Trans>
              }
            />
            <Feature
              icon={GroupIcon}
              titleText={<Trans>Up to 50 people</Trans>}
              descriptionText={
                <Trans>Bring up to 50 friends together in one chat.</Trans>
              }
            />
            <Feature
              icon={ShieldIcon}
              titleText={<Trans>You’re in control</Trans>}
              descriptionText={
                <Trans>
                  Mute, leave, or remove people anytime. It’s your chat.
                </Trans>
              }
            />
          </View>
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function Feature({
  icon: Icon,
  titleText,
  descriptionText,
  style,
}: {
  icon: React.ComponentType<SVGIconProps>
  titleText: React.ReactNode
  descriptionText: React.ReactNode
} & TextStyleProp) {
  const t = useTheme()
  return (
    <View style={[a.flex_row, a.gap_md, style]}>
      <Icon size="md" style={[t.atoms.text]} />
      <View style={[a.flex_1, a.gap_2xs]}>
        <Text style={[a.text_md, a.font_semi_bold]}>{titleText}</Text>
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          {descriptionText}
        </Text>
      </View>
    </View>
  )
}
