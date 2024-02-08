import React from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useNavigation} from '@react-navigation/native'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {Text as OldText} from '#/view/com/util/text/Text'
import {TextLink} from '#/view/com/util/Link'
import {CenteredView} from '#/view/com/util/Views'
import {sanitizeHandle} from 'lib/strings/handles'
import {makeProfileLink} from 'lib/routes/links'
import {NavigationProp} from 'lib/routes/types'
import {BACK_HITSLOP} from 'lib/constants'
import {isNative} from 'platform/detection'
import {useLingui} from '@lingui/react'
import {Trans, msg} from '@lingui/macro'
import {useSetDrawerOpen} from '#/state/shell'
import {emitSoftReset} from '#/state/events'
import {AppBskyModerationDefs} from '@atproto/api'
import {HandIcon} from '#/lib/icons'
import {shareUrl} from 'lib/sharing'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {Button as OldButton} from '#/view/com/util/forms/Button'
import {NativeDropdown, DropdownItem} from 'view/com/util/forms/NativeDropdown'
import {useSession} from '#/state/session'
import {useModalControls} from '#/state/modals'

import {useTheme, atoms as a, tokens} from '#/alf'
import {Text} from '#/components/Typography'
import {Button, ButtonText} from '#/components/Button'
import {RaisingHande4Finger_Stroke2_Corner0_Rounded as RaisingHand} from '#/components/icons/RaisingHand'
import {InlineLink} from '#/components/Link'
import {DotGrid1x3Horizontal_Stroke2_Corner0_Rounded as Ellipsis} from '#/components/icons/DotGrid'
import {ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeft} from '#/components/icons/Chevron'
import {Divider} from '#/components/Divider'

export function Header({
  info,
}: {
  info: AppBskyModerationDefs.ModServiceViewDetailed
}) {
  const t = useTheme()
  const setDrawerOpen = useSetDrawerOpen()
  const navigation = useNavigation<NavigationProp>()
  const {_} = useLingui()
  const {isMobile} = useWebMediaQueries()
  const pal = usePalette('default')
  const canGoBack = navigation.canGoBack()

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

  return (
    <View style={[a.pb_xl]}>
      {isMobile && (
        <View style={[a.mb_xl]}>
          <View
            style={[a.flex_row, a.justify_between, a.align_center, a.pb_md]}>
            <Button
              testID="headerDrawerBtn"
              size="small"
              color="secondary"
              variant="ghost"
              shape="round"
              onPress={canGoBack ? onPressBack : onPressMenu}
              label={canGoBack ? 'Back' : 'Menu'}>
              {canGoBack ? (
                <ChevronLeft width={18} style={[t.atoms.text]} />
              ) : (
                <FontAwesomeIcon
                  size={18}
                  icon="bars"
                  style={[styles.backIcon, pal.textLight]}
                />
              )}
            </Button>

            <CommonControls info={info} />
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
            colors={tokens.gradients.sky.values.map(c => c[1])}
            locations={tokens.gradients.bonfire.values.map(c => c[0])}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[a.absolute, a.inset_0]}
          />
          <RaisingHand width={32} fill={t.atoms.text.color} style={[a.z_10]} />
        </View>

        <View style={[a.flex_1, a.gap_xs]}>
          <InlineLink
            testID="headerTitle"
            to={makeProfileLink(info.creator, 'modservice')}
            onPress={emitSoftReset}
            style={[a.text_4xl, a.font_bold, t.atoms.text]}>
            {/* A really long and complex title for a moderation service */}
            {info.creator.displayName
              ? sanitizeDisplayName(info.creator.displayName)
              : sanitizeHandle(info.creator.handle, '@')}
          </InlineLink>

          <Text style={[a.text_md, t.atoms.text_contrast_700]}>
            <Trans>Moderation service</Trans>
          </Text>
        </View>

        <View style={[a.flex_row, a.align_center, a.gap_md]}>
          <Button
            size="small"
            variant="solid"
            color="primary"
            label={_(msg`Subscribe to moderation service`)}>
            <ButtonText>
              <Trans>Subscribe</Trans>
            </ButtonText>
          </Button>

          {!isMobile && <CommonControls info={info} />}
        </View>
      </View>
    </View>
  )
}

function CommonControls({
  info,
}: {
  info: AppBskyModerationDefs.ModServiceViewDetailed
}) {
  const t = useTheme()
  const {hasSession} = useSession()
  const {openModal} = useModalControls()
  const {_} = useLingui()

  const onPressShare = React.useCallback(() => {
    const url = makeProfileLink(info.creator, 'modservice')
    shareUrl(url)
    // track('CustomFeed:Share') TODO
  }, [info /*, track*/])

  const onPressReport = React.useCallback(() => {
    if (!info) return
    openModal({
      name: 'report',
      uri: info.uri,
      cid: info.cid,
    })
  }, [openModal, info])

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
    <>
      <NativeDropdown
        testID="headerDropdownBtn"
        items={dropdownItems}
        accessibilityLabel={_(msg`More options`)}
        accessibilityHint="">
        <View style={[a.rounded_full, a.p_sm, t.atoms.bg_contrast_50]}>
          <Ellipsis width={20} fill={t.atoms.text_contrast_700.color} />
        </View>
      </NativeDropdown>
    </>
  )
}

const styles = StyleSheet.create({
  backBtn: {
    width: 20,
    height: 30,
  },
  backBtnWide: {
    width: 20,
    height: 30,
    paddingHorizontal: 6,
  },
  backIcon: {
    marginTop: 6,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 50,
  },
})
