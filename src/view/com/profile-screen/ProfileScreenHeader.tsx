import React from 'react'
import {View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {NativeDropdown, DropdownItem} from '../util/forms/NativeDropdown'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {SimpleViewHeader} from '../util/SimpleViewHeader'
import {Text} from '../util/text/Text'
import {TextLink} from '../util/Link'
import {UserAvatar, UserAvatarType} from '../util/UserAvatar'
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

export const ProfileScreenHeader = observer(function HeaderImpl({
  info,
  objectLabel,
  avatarType,
  dropdownItems,
  minimalMode,
  children,
}: React.PropsWithChildren<{
  info: ProfileScreenHeaderInfo | undefined
  objectLabel: string
  avatarType: UserAvatarType
  dropdownItems: DropdownItem[]
  minimalMode: boolean
}>) {
  const store = useStores()
  const {isMobile} = useWebMediaQueries()
  const pal = usePalette('default')

  if (!info) {
    return (
      <SimpleViewHeader
        showBackButton={isMobile}
        style={
          !isMobile && [pal.border, {borderLeftWidth: 1, borderRightWidth: 1}]
        }>
        <Text
          type="title-lg"
          style={{flex: 1, fontWeight: 'bold'}}
          numberOfLines={1}>
          Loading...
        </Text>
      </SimpleViewHeader>
    )
  }

  return (
    <SimpleViewHeader
      showBackButton={isMobile}
      style={
        !isMobile && [pal.border, {borderLeftWidth: 1, borderRightWidth: 1}]
      }>
      <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
        {minimalMode ? (
          <Text type="title-lg" style={{flex: 1}} numberOfLines={1}>
            <TextLink
              type="title-lg"
              href={info.href}
              style={[pal.text, {fontWeight: 'bold'}]}
              text={info.title}
              onPress={() => store.emitScreenSoftReset()}
            />
          </Text>
        ) : (
          <>
            <View style={{marginRight: 12}}>
              <UserAvatar type={avatarType} avatar={info.avatar} size={48} />
            </View>
            <View style={{flex: 1}}>
              <Text
                type="title-lg"
                style={{flex: 1, fontWeight: 'bold'}}
                numberOfLines={1}>
                <TextLink
                  type="title-lg"
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
            </View>
          </>
        )}
        {children}
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
              color={pal.colors.textLight}
            />
          </View>
        </NativeDropdown>
      </View>
    </SimpleViewHeader>
  )
})
