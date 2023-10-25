import React from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useNavigation} from '@react-navigation/native'
import {NativeDropdown, DropdownItem} from '../util/forms/NativeDropdown'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {Text} from '../util/text/Text'
import {TextLink} from '../util/Link'
import {UserAvatar, UserAvatarType} from '../util/UserAvatar'
import {CenteredView} from '../util/Views'
import {sanitizeHandle} from 'lib/strings/handles'
import {makeProfileLink} from 'lib/routes/links'
import {useStores} from 'state/index'
import {ProfileScreenHeaderInfo, ProfileScreenHeaderBtn} from './types'
import {NavigationProp} from 'lib/routes/types'
import {BACK_HITSLOP} from 'lib/constants'
import {isNative} from 'platform/detection'

export const ProfileScreenFullHeader = observer(function HeaderImpl({
  info,
  avatarType,
  buttons,
  dropdownItems,
}: {
  info: ProfileScreenHeaderInfo | undefined
  avatarType: UserAvatarType
  buttons?: ProfileScreenHeaderBtn[]
  dropdownItems: DropdownItem[]
}) {
  const store = useStores()
  const navigation = useNavigation<NavigationProp>()
  const {isMobile} = useWebMediaQueries()
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')
  const canGoBack = navigation.canGoBack()

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  const onPressMenu = React.useCallback(() => {
    store.shell.openDrawer()
  }, [store])

  const buttonsRendered = buttons?.map((btn, i) => (
    <Pressable
      key={String(i + (btn.label || ''))}
      style={[btn.inverted ? palInverted.view : pal.viewLight, styles.btn]}
      accessibilityRole="button"
      accessibilityLabel={btn.accessibilityLabel}
      accessibilityHint=""
      onPress={btn.onPress}>
      {btn.icon && (
        <View style={{justifyContent: 'center', height: 20}}>
          <FontAwesomeIcon {...btn.icon} />
        </View>
      )}
      {btn.label && (
        <View style={{justifyContent: 'center', height: 20}}>
          <Text
            type="button"
            style={btn.inverted ? palInverted.text : pal.text}>
            {btn.label}
          </Text>
        </View>
      )}
    </Pressable>
  ))

  return (
    <CenteredView>
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
          {buttonsRendered}
          <NativeDropdown
            testID="headerDropdownBtn"
            items={dropdownItems}
            accessibilityLabel="More options"
            accessibilityHint="">
            <View style={[pal.viewLight, styles.btn]}>
              <FontAwesomeIcon
                icon="ellipsis"
                size={20}
                color={pal.colors.text}
              />
            </View>
          </NativeDropdown>
        </View>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingTop: 14,
          paddingBottom: 6,
          paddingHorizontal: isMobile ? 12 : 14,
        }}>
        <Pressable
          testID="headerAviButton"
          onPress={undefined /*TODO onPressAvi*/}
          accessibilityRole="image"
          accessibilityLabel="View the avatar"
          accessibilityHint="">
          <UserAvatar type={avatarType} size={58} avatar={info?.avatar} />
        </Pressable>
        <View>
          <Text type="title-xl" style={{fontWeight: 'bold'}} numberOfLines={1}>
            <TextLink
              type="title-xl"
              href="/"
              style={[pal.text, {fontWeight: 'bold'}]}
              text={info?.title || 'Loading...'}
              onPress={() => store.emitScreenSoftReset()}
            />
          </Text>

          <Text type="xl" style={[pal.textLight]} numberOfLines={1}>
            by{' '}
            {!info ? (
              ''
            ) : info.isOwner ? (
              'you'
            ) : (
              <TextLink
                text={sanitizeHandle(info.creator.handle, '@')}
                href={makeProfileLink(info.creator)}
                style={pal.textLight}
              />
            )}
          </Text>
        </View>
        {!isMobile && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginLeft: 'auto',
              alignSelf: 'flex-start',
            }}>
            {buttonsRendered}
            <NativeDropdown
              testID="headerDropdownBtn"
              items={dropdownItems}
              accessibilityLabel="More options"
              accessibilityHint="">
              <View style={[pal.viewLight, styles.btn]}>
                <FontAwesomeIcon
                  icon="ellipsis"
                  size={20}
                  color={pal.colors.text}
                />
              </View>
            </NativeDropdown>
          </View>
        )}
      </View>
    </CenteredView>
  )
})

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
    paddingHorizontal: 12,
    borderRadius: 50,
    marginLeft: 6,
  },
})
