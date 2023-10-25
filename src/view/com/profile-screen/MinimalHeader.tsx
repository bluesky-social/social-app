import React from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {NativeDropdown, DropdownItem} from '../util/forms/NativeDropdown'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {SimpleViewHeader} from '../util/SimpleViewHeader'
import {Text} from '../util/text/Text'
import {TextLink} from '../util/Link'
import {useStores} from 'state/index'
import {ProfileScreenHeaderInfo, ProfileScreenHeaderBtn} from './types'

export const ProfileScreenMinimalHeader = observer(function HeaderImpl({
  info,
  buttons,
  dropdownItems,
}: {
  info: ProfileScreenHeaderInfo | undefined
  buttons?: ProfileScreenHeaderBtn[]
  dropdownItems: DropdownItem[]
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
        {buttons?.map((btn, i) => (
          <Pressable
            key={String(i + (btn.label || ''))}
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
