import React from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useNavigation} from '@react-navigation/native'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {Text} from '../util/text/Text'
import {TextLink} from '../util/Link'
import {CenteredView} from '../util/Views'
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
import {Button} from '../util/forms/Button'
import {NativeDropdown, DropdownItem} from 'view/com/util/forms/NativeDropdown'
import {useSession} from '#/state/session'
import {useModalControls} from '#/state/modals'

export function ModServiceHeader({
  info,
}: {
  info: AppBskyModerationDefs.ModServiceViewDetailed
}) {
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
    <CenteredView style={pal.view}>
      {isMobile && (
        <View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              borderBottomWidth: 1,
              paddingTop: isNative ? 0 : 8,
              paddingBottom: 8,
              paddingHorizontal: isMobile ? 12 : 14,
            },
            pal.border,
          ]}>
          <Pressable
            testID="headerDrawerBtn"
            onPress={canGoBack ? onPressBack : onPressMenu}
            hitSlop={BACK_HITSLOP}
            style={canGoBack ? styles.backBtn : styles.backBtnWide}
            accessibilityRole="button"
            accessibilityLabel={canGoBack ? 'Back' : 'Menu'}
            accessibilityHint="">
            {canGoBack ? (
              <FontAwesomeIcon
                size={18}
                icon="angle-left"
                style={[styles.backIcon, pal.text]}
              />
            ) : (
              <FontAwesomeIcon
                size={18}
                icon="bars"
                style={[styles.backIcon, pal.textLight]}
              />
            )}
          </Pressable>
          <View style={{flex: 1}} />
          <CommonControls info={info} />
        </View>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          paddingTop: 14,
          paddingBottom: 14,
          paddingHorizontal: isMobile ? 12 : 14,
        }}>
        <View style={{alignSelf: 'center'}}>
          <HandIcon style={pal.text} size={32} strokeWidth={5.5} />
        </View>
        <View style={{flex: 1}}>
          <TextLink
            testID="headerTitle"
            type="title-xl"
            href={makeProfileLink(info.creator, 'modservice')}
            style={[pal.text, {fontWeight: 'bold'}]}
            text={
              info.creator.displayName
                ? sanitizeDisplayName(info.creator.displayName)
                : sanitizeHandle(info.creator.handle, '@')
            }
            onPress={emitSoftReset}
            numberOfLines={4}
          />
          <Text type="xl" style={[pal.textLight]} numberOfLines={1}>
            <Trans>Moderation service</Trans>
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Button type="primary" label={_(msg`Subscribe`)} />
          {!isMobile && <CommonControls info={info} />}
        </View>
      </View>
    </CenteredView>
  )
}

function CommonControls({
  info,
}: {
  info: AppBskyModerationDefs.ModServiceViewDetailed
}) {
  const pal = usePalette('default')
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
        <View style={[pal.viewLight, styles.btn, {marginLeft: 6}]}>
          <FontAwesomeIcon icon="ellipsis" size={20} color={pal.colors.text} />
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
