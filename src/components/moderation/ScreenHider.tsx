import React from 'react'
import {
  StyleProp,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native'
import {ModerationUI} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'
import {NavigationProp} from '#/lib/routes/types'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {
  ModerationDetailsDialog,
  useModerationDetailsDialogControl,
} from '#/components/moderation/ModerationDetailsDialog'
import {Text} from '#/components/Typography'

export function ScreenHider({
  testID,
  screenDescription,
  modui,
  style,
  containerStyle,
  children,
}: React.PropsWithChildren<{
  testID?: string
  screenDescription: string
  modui: ModerationUI
  style?: StyleProp<ViewStyle>
  containerStyle?: StyleProp<ViewStyle>
}>) {
  const t = useTheme()
  const {_} = useLingui()
  const [override, setOverride] = React.useState(false)
  const navigation = useNavigation<NavigationProp>()
  const {isMobile} = useWebMediaQueries()
  const control = useModerationDetailsDialogControl()
  const blur = modui.blurs[0]
  const desc = useModerationCauseDescription(blur)

  if (!blur || override) {
    return (
      <View testID={testID} style={style}>
        {children}
      </View>
    )
  }

  const isNoPwi = !!modui.blurs.find(
    cause =>
      cause.type === 'label' &&
      cause.labelDef.identifier === '!no-unauthenticated',
  )
  return (
    <CenteredView
      style={[
        a.flex_1,
        {
          paddingTop: 100,
          paddingBottom: 150,
        },
        t.atoms.bg,
        containerStyle,
      ]}
      sideBorders>
      <View style={[a.align_center, a.mb_md]}>
        <View
          style={[
            t.atoms.bg_contrast_975,
            a.align_center,
            a.justify_center,
            {
              borderRadius: 25,
              width: 50,
              height: 50,
            },
          ]}>
          <desc.icon width={24} fill={t.atoms.bg.backgroundColor} />
        </View>
      </View>
      <Text
        style={[a.text_4xl, a.font_bold, a.text_center, a.mb_md, t.atoms.text]}>
        {isNoPwi ? (
          <Trans>Sign-in Required</Trans>
        ) : (
          <Trans>Content Warning</Trans>
        )}
      </Text>
      <Text
        style={[
          a.text_lg,
          a.mb_md,
          a.px_lg,
          a.text_center,
          a.leading_snug,
          t.atoms.text_contrast_medium,
        ]}>
        {isNoPwi ? (
          <Trans>
            This account has requested that users sign in to view their profile.
          </Trans>
        ) : (
          <>
            <Trans>This {screenDescription} has been flagged:</Trans>{' '}
            <Text
              style={[
                a.text_lg,
                a.font_bold,
                a.leading_snug,
                t.atoms.text,
                a.ml_xs,
              ]}>
              {desc.name}.{' '}
            </Text>
            <TouchableWithoutFeedback
              onPress={() => {
                control.open()
              }}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Learn more about this warning`)}
              accessibilityHint="">
              <Text
                style={[
                  a.text_lg,
                  a.leading_snug,
                  {
                    color: t.palette.primary_500,
                  },
                  web({
                    cursor: 'pointer',
                  }),
                ]}>
                <Trans>Learn More</Trans>
              </Text>
            </TouchableWithoutFeedback>
            <ModerationDetailsDialog control={control} modcause={blur} />
          </>
        )}{' '}
      </Text>
      {isMobile && <View style={a.flex_1} />}
      <View style={[a.flex_row, a.justify_center, a.my_md, a.gap_md]}>
        <Button
          variant="solid"
          color="primary"
          size="large"
          style={[a.rounded_full]}
          label={_(msg`Go back`)}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack()
            } else {
              navigation.navigate('Home')
            }
          }}>
          <ButtonText>
            <Trans>Go back</Trans>
          </ButtonText>
        </Button>
        {!modui.noOverride && (
          <Button
            variant="solid"
            color="secondary"
            size="large"
            style={[a.rounded_full]}
            label={_(msg`Show anyway`)}
            onPress={() => setOverride(v => !v)}>
            <ButtonText>
              <Trans>Show anyway</Trans>
            </ButtonText>
          </Button>
        )}
      </View>
    </CenteredView>
  )
}
