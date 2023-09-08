import React from 'react'
import {View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Text} from 'view/com/util/text/Text'
import {Button} from 'view/com/util/forms/Button'
import {UserAvatar} from 'view/com/util/UserAvatar'
import * as Toast from 'view/com/util/Toast'
import {HeartIcon} from 'lib/icons'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {sanitizeHandle} from 'lib/strings/handles'
import {CustomFeedModel} from 'state/models/feeds/custom-feed'

export const RecommendedFeedsItem = observer(function RecommendedFeedsItemImpl({
  item,
}: {
  item: CustomFeedModel
}) {
  const {isMobile} = useWebMediaQueries()
  const pal = usePalette('default')
  if (!item) return null
  const onToggle = async () => {
    if (item.isSaved) {
      try {
        await item.unsave()
      } catch (e) {
        Toast.show('There was an issue contacting your server')
        console.error('Failed to unsave feed', {e})
      }
    } else {
      try {
        await item.save()
        await item.pin()
      } catch (e) {
        Toast.show('There was an issue contacting your server')
        console.error('Failed to pin feed', {e})
      }
    }
  }
  return (
    <View testID={`feed-${item.displayName}`}>
      <View
        style={[
          pal.border,
          {
            flex: isMobile ? 1 : undefined,
            flexDirection: 'row',
            gap: 18,
            maxWidth: isMobile ? undefined : 670,
            borderRightWidth: isMobile ? undefined : 1,
            paddingHorizontal: 24,
            paddingVertical: isMobile ? 12 : 24,
            borderTopWidth: 1,
          },
        ]}>
        <View style={{marginTop: 2}}>
          <UserAvatar type="algo" size={42} avatar={item.data.avatar} />
        </View>
        <View style={{flex: isMobile ? 1 : undefined}}>
          <Text
            type="2xl-bold"
            numberOfLines={1}
            style={[pal.text, {fontSize: 19}]}>
            {item.displayName}
          </Text>

          <Text style={[pal.textLight, {marginBottom: 8}]} numberOfLines={1}>
            by {sanitizeHandle(item.data.creator.handle, '@')}
          </Text>

          {item.data.description ? (
            <Text
              type="xl"
              style={[
                pal.text,
                {
                  flex: isMobile ? 1 : undefined,
                  maxWidth: 550,
                  marginBottom: 18,
                },
              ]}
              numberOfLines={6}>
              {item.data.description}
            </Text>
          ) : null}

          <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
            <Button
              type="inverted"
              style={{paddingVertical: 6}}
              onPress={onToggle}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingRight: 2,
                  gap: 6,
                }}>
                {item.isSaved ? (
                  <>
                    <FontAwesomeIcon
                      icon="check"
                      size={16}
                      color={pal.colors.textInverted}
                    />
                    <Text type="lg-medium" style={pal.textInverted}>
                      Added
                    </Text>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon
                      icon="plus"
                      size={16}
                      color={pal.colors.textInverted}
                    />
                    <Text type="lg-medium" style={pal.textInverted}>
                      Add
                    </Text>
                  </>
                )}
              </View>
            </Button>

            <View style={{flexDirection: 'row', gap: 4}}>
              <HeartIcon
                size={16}
                strokeWidth={2.5}
                style={[pal.textLight, {position: 'relative', top: 2}]}
              />
              <Text type="lg-medium" style={[pal.text, pal.textLight]}>
                {item.data.likeCount || 0}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
})
