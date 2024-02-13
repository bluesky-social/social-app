import React from 'react'
import {View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {useNavigation} from '@react-navigation/native'
import {AppBskyModerationDefs} from '@atproto/api'
import {useLingui} from '@lingui/react'
import {Trans, msg} from '@lingui/macro'

import {sanitizeHandle} from '#/lib/strings/handles'
import {makeProfileLink} from '#/lib/routes/links'
import {NavigationProp} from '#/lib/routes/types'
import {useSetDrawerOpen} from '#/state/shell'
import {emitSoftReset} from '#/state/events'
import {shareUrl} from '#/lib/sharing'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {
  NativeDropdown,
  DropdownItem,
} from '#/view/com/util/forms/NativeDropdown'
import {useSession} from '#/state/session'
import {useModalControls} from '#/state/modals'
import {
  useModServiceSubscriptionMutation,
  useModServiceEnableMutation,
} from '#/state/queries/modservice'
import {UsePreferencesQueryResponse} from '#/state/queries/preferences'

import {useTheme, atoms as a, tokens, web, native, useBreakpoints} from '#/alf'
import {Text} from '#/components/Typography'
import {Button, ButtonText, ButtonIcon} from '#/components/Button'
import {RaisingHande4Finger_Stroke2_Corner0_Rounded as RaisingHand} from '#/components/icons/RaisingHand'
import {DotGrid1x3Horizontal_Stroke2_Corner0_Rounded as Ellipsis} from '#/components/icons/DotGrid'
import {ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeft} from '#/components/icons/Chevron'
import {Bars3_Stroke2_Corner0_Rounded as Bars} from '#/components/icons/Bars'
import {Divider} from '#/components/Divider'

export function Header({
  preferences,
  modservice,
}: {
  preferences: UsePreferencesQueryResponse
  modservice: AppBskyModerationDefs.ModServiceViewDetailed
}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const setDrawerOpen = useSetDrawerOpen()
  const navigation = useNavigation<NavigationProp>()
  const {_} = useLingui()
  const canGoBack = navigation.canGoBack()
  const {mutateAsync: toggleSubscription, variables} =
    useModServiceSubscriptionMutation()
  const isSubscribed =
    variables?.subscribe ??
    preferences.moderationOpts.mods.find(
      mod => mod.did === modservice.creator.did,
    )
  const {mutateAsync: toggleEnabled, variables: enabledVariables} =
    useModServiceEnableMutation()
  const isEnabled =
    enabledVariables?.enabled ??
    preferences.moderationOpts.mods.find(
      mod => mod.did === modservice.creator.did && mod.enabled,
    ) ??
    variables?.subscribe
  const [subscriptionError, setSubscriptionError] = React.useState<string>('')
  const [enablementError, setEnablementError] = React.useState<string>('')

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  const onPressMenu = React.useCallback(() => {
    setDrawerOpen(true)
  }, [setDrawerOpen])

  const onPressSubscribe = React.useCallback(async () => {
    try {
      await toggleSubscription({
        did: modservice.creator.did,
        subscribe: !isSubscribed,
      })
    } catch (e: any) {
      setSubscriptionError(e.message)
    }
  }, [toggleSubscription, isSubscribed, modservice.creator.did])

  const onPressEnable = React.useCallback(async () => {
    try {
      await toggleEnabled({
        did: modservice.creator.did,
        enabled: !isEnabled,
      })
    } catch (e: any) {
      setEnablementError(e.message)
    }
  }, [toggleEnabled, isEnabled, modservice.creator.did])

  return (
    <View style={[a.pb_xl, web(a.pt_md), gtMobile && web(a.pt_2xl)]}>
      {!gtMobile && (
        <View style={[a.mb_xl]}>
          <View
            style={[a.flex_row, a.justify_between, a.align_center, a.pb_md]}>
            <Button
              testID="headerDrawerBtn"
              size="small"
              color="secondary"
              variant="solid"
              shape="square"
              onPress={canGoBack ? onPressBack : onPressMenu}
              label={canGoBack ? _(msg`Go back`) : _(msg`Open main menu`)}>
              <ButtonIcon icon={canGoBack ? ChevronLeft : Bars} />
            </Button>

            <View style={[a.flex_row, a.align_center, a.gap_md]}>
              <Button
                size="small"
                variant="solid"
                color="primary"
                label={_(msg`Subscribe to this moderation service`)}
                onPress={onPressSubscribe}>
                <ButtonText>
                  {isSubscribed ? (
                    <Trans>Unsubscribe</Trans>
                  ) : (
                    <Trans>Subscribe</Trans>
                  )}
                </ButtonText>
              </Button>

              <CommonControls modservice={modservice} />
            </View>
          </View>

          <Divider />
        </View>
      )}

      <View style={[a.flex_row, a.gap_lg, a.align_start]}>
        <View
          style={[
            a.p_md,
            t.atoms.bg_contrast_50,
            a.rounded_md,
            a.overflow_hidden,
          ]}>
          <LinearGradient
            colors={tokens.gradients.midnight.values.map(c => c[1])}
            locations={tokens.gradients.midnight.values.map(c => c[0])}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[a.absolute, a.inset_0]}
          />
          <RaisingHand width={32} fill={t.palette.white} style={[a.z_10]} />
        </View>

        <View style={[a.flex_1, a.gap_xs, native(a.pt_2xs)]}>
          <Button
            label={_(msg`Refresh page`)}
            testID="headerTitle"
            // TODO do we need this?
            onPress={emitSoftReset}
            style={[a.justify_start]}>
            <Text style={[a.text_4xl, a.font_bold, t.atoms.text]}>
              {modservice.creator.displayName
                ? sanitizeDisplayName(modservice.creator.displayName)
                : sanitizeHandle(modservice.creator.handle, '@')}
            </Text>
          </Button>

          <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
            <Trans>Moderation service</Trans>
          </Text>
        </View>

        {gtMobile && (
          <View style={[a.flex_row, a.align_center, a.gap_md]}>
            {isSubscribed && (
              <Button
                size="small"
                variant="solid"
                color="secondary"
                label={
                  isEnabled
                    ? _(msg`Disable this moderation service`)
                    : _(msg`Enable this moderation service`)
                }
                onPress={onPressEnable}>
                <ButtonText>
                  {isEnabled ? <Trans>Disable</Trans> : <Trans>Enable</Trans>}
                </ButtonText>
              </Button>
            )}

            <Button
              size="small"
              variant="solid"
              color="primary"
              label={
                isSubscribed
                  ? _(msg`Unsubscribe from this moderation service`)
                  : _(msg`Subscribe to this moderation service`)
              }
              onPress={onPressSubscribe}>
              <ButtonText>
                {isSubscribed ? (
                  <Trans>Unsubscribe</Trans>
                ) : (
                  <Trans>Subscribe</Trans>
                )}
              </ButtonText>
            </Button>

            <CommonControls modservice={modservice} />
          </View>
        )}
      </View>

      {subscriptionError ||
        (enablementError && (
          <View style={[a.pt_lg]}>
            <View
              style={[
                a.px_lg,
                a.py_md,
                a.rounded_sm,
                a.border,
                a.gap_xs,
                {
                  backgroundColor: t.palette.negative_50,
                  borderColor: t.palette.negative_100,
                },
              ]}>
              <Text style={[a.font_bold, {color: t.palette.negative_950}]}>
                <Trans>
                  An error occurred while editing your subscription.
                </Trans>
              </Text>
              <Text style={[{color: t.palette.negative_900}]}>
                {subscriptionError || enablementError}
              </Text>
            </View>
          </View>
        ))}
    </View>
  )
}

function CommonControls({
  modservice,
}: {
  modservice: AppBskyModerationDefs.ModServiceViewDetailed
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {hasSession} = useSession()
  const {openModal} = useModalControls()

  const onPressShare = React.useCallback(() => {
    const url = makeProfileLink(modservice.creator, 'modservice')
    shareUrl(url)
    // track('CustomFeed:Share') TODO
  }, [modservice /*, track*/])

  const onPressReport = React.useCallback(() => {
    if (!modservice) return
    openModal({
      name: 'report',
      uri: modservice.uri,
      cid: modservice.cid,
    })
  }, [openModal, modservice])

  const dropdownItems: DropdownItem[] = React.useMemo(() => {
    return [
      hasSession && {
        testID: 'modHeaderDropdownReportBtn',
        label: _(msg`Report mod service`),
        onPress: onPressReport,
        icon: {
          ios: {
            name: 'exclamationmark.triangle',
          },
          android: 'ic_menu_report_image',
          web: 'circle-exclamation',
        },
      },
      {
        testID: 'modHeaderDropdownShareBtn',
        label: _(msg`Share mod service`),
        onPress: onPressShare,
        icon: {
          ios: {
            name: 'square.and.arrow.up',
          },
          android: 'ic_menu_share',
          web: 'share',
        },
      },
    ].filter(Boolean) as DropdownItem[]
  }, [hasSession, onPressReport, onPressShare, _])

  return (
    <NativeDropdown
      testID="headerDropdownBtn"
      items={dropdownItems}
      accessibilityLabel={_(msg`More options`)}
      accessibilityHint="">
      <View style={[a.rounded_full, a.p_sm, t.atoms.bg_contrast_50]}>
        <Ellipsis width={20} fill={t.atoms.text_contrast_medium.color} />
      </View>
    </NativeDropdown>
  )
}
