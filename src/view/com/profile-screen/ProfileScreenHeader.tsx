import React from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {
  FontAwesomeIcon,
  Props as FontAwesomeIconProps,
} from '@fortawesome/react-native-fontawesome'
import {NativeDropdown, DropdownItem} from '../util/forms/NativeDropdown'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {SimpleViewHeader} from '../util/SimpleViewHeader'
import {Text} from '../util/text/Text'
import {TextLink} from '../util/Link'
import {UserAvatar, UserAvatarType} from '../util/UserAvatar'
import {CenteredView} from '../util/Views'
import {sanitizeHandle} from 'lib/strings/handles'
import {makeProfileLink} from 'lib/routes/links'
import {useStores} from 'state/index'

interface ProfileScreenHeaderInfo {
  href: string
  title: string
  avatar: string | undefined
  isOwner: boolean
  creator: {
    did: string
    handle: string
  }
}

export interface ProfileScreenHeaderBtn {
  inverted?: boolean
  icon?: FontAwesomeIconProps
  label?: string
  accessibilityLabel: string
  onPress: () => void
}

export const ProfileScreenHeader = observer(function HeaderImpl({
  info,
  objectLabel,
  avatarType,
  buttons,
  dropdownItems,
  minimalMode,
}: {
  info: ProfileScreenHeaderInfo | undefined
  objectLabel: string
  avatarType: UserAvatarType
  buttons?: ProfileScreenHeaderBtn[]
  dropdownItems: DropdownItem[]
  minimalMode: boolean
}) {
  const store = useStores()
  const {isMobile} = useWebMediaQueries()
  const pal = usePalette('default')
  const palInverted = usePalette('inverted')
  const titleSize = isMobile ? 'title' : 'title-lg'

  if (!info) {
    return (
      <SimpleViewHeader
        showBackButton={isMobile}
        style={
          !isMobile && [pal.border, {borderLeftWidth: 1, borderRightWidth: 1}]
        }>
        <Text
          type={titleSize}
          style={{flex: 1, fontWeight: 'bold'}}
          numberOfLines={1}>
          Loading...
        </Text>
      </SimpleViewHeader>
    )
  }

  if (minimalMode) {
    return (
      <SimpleViewHeader
        showBackButton={isMobile}
        style={
          !isMobile && [pal.border, {borderLeftWidth: 1, borderRightWidth: 1}]
        }>
        <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
          <Text type={titleSize} style={{flex: 1}} numberOfLines={1}>
            <TextLink
              type={titleSize}
              href={info.href}
              style={[pal.text, {fontWeight: 'bold'}]}
              text={info.title}
              onPress={() => store.emitScreenSoftReset()}
            />
          </Text>
          {buttons?.map(btn => (
            <Pressable
              key={btn.label}
              style={[
                btn.inverted ? palInverted.view : pal.view,
                styles.btn,
                {paddingVertical: 2},
              ]}
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
          ))}
          <NativeDropdown
            testID="feedHeaderDropdownBtn"
            items={dropdownItems}
            accessibilityLabel="More options"
            accessibilityHint="">
            <View
              style={{
                paddingLeft: 12,
                paddingRight: isMobile ? 12 : 0,
              }}>
              <FontAwesomeIcon
                icon="ellipsis"
                size={20}
                color={pal.colors.text}
              />
            </View>
          </NativeDropdown>
        </View>
      </SimpleViewHeader>
    )
  }

  return (
    <>
      <SimpleViewHeader
        showBackButton={isMobile}
        style={
          !isMobile && [pal.border, {borderLeftWidth: 1, borderRightWidth: 1}]
        }>
        <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
          <View style={{marginRight: 'auto'}}>
            <UserAvatar
              type={avatarType}
              avatar={info.avatar}
              size={isMobile ? 32 : 48}
            />
          </View>
          {buttons?.map(btn => (
            <Pressable
              key={btn.label}
              style={[
                btn.inverted ? palInverted.view : pal.viewLight,
                styles.btn,
              ]}
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
          ))}
          <NativeDropdown
            testID="feedHeaderDropdownBtn"
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
      </SimpleViewHeader>
      <CenteredView
        style={[
          pal.border,
          {paddingHorizontal: isMobile ? 12 : 18},
          !isMobile && {borderLeftWidth: 1, borderRightWidth: 1},
        ]}>
        <Text type={titleSize} style={{fontWeight: 'bold'}} numberOfLines={1}>
          <TextLink
            type="title-xl"
            href="/"
            style={[pal.text, {fontWeight: 'bold'}]}
            text={info.title}
            onPress={() => store.emitScreenSoftReset()}
          />
        </Text>

        <Text type="md" style={[pal.textLight]} numberOfLines={1}>
          {objectLabel} by{' '}
          {info.isOwner ? (
            'you'
          ) : (
            <TextLink
              text={sanitizeHandle(info.creator.handle, '@')}
              href={makeProfileLink(info.creator)}
              style={pal.textLight}
            />
          )}
        </Text>
      </CenteredView>
    </>
  )
})

const styles = StyleSheet.create({
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
