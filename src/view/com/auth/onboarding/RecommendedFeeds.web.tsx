import React from 'react'
import {FlatList, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Text} from 'view/com/util/text/Text'
import {TitleColumnLayout} from 'view/com/util/layouts/TitleColumnLayout'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {Button} from 'view/com/util/forms/Button'
import * as Toast from 'view/com/util/Toast'
import {usePalette} from 'lib/hooks/usePalette'
import {useCustomFeed} from 'lib/hooks/useCustomFeed'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {sanitizeHandle} from 'lib/strings/handles'
import {HeartIcon} from 'lib/icons'
import {RECOMMENDED_FEEDS} from 'lib/constants'

type Props = {
  next: () => void
}
export const RecommendedFeeds = observer(({next}: Props) => {
  const pal = usePalette('default')

  const title = (
    <>
      <Text style={[pal.textLight, styles.title1]}>Choose your</Text>
      <Text style={[pal.link, styles.title2]}>Recomended</Text>
      <Text style={[pal.link, styles.title2]}>Feeds</Text>
      <Text type="2xl-medium" style={[pal.textLight, styles.description]}>
        Feeds are created by users to curate content. Choose some feeds that you
        find interesting.
      </Text>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: 20,
        }}>
        <Button onPress={next} testID="continueBtn">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingLeft: 2,
              gap: 6,
            }}>
            <Text
              type="2xl-medium"
              style={{color: '#fff', position: 'relative', top: -1}}>
              Done
            </Text>
            <FontAwesomeIcon icon="angle-right" color="#fff" size={14} />
          </View>
        </Button>
      </View>
    </>
  )

  return (
    <TitleColumnLayout
      testID="recommendedFeedsScreen"
      title={title}
      horizontal
      titleStyle={{minWidth: 470}}
      contentStyle={{paddingHorizontal: 0}}>
      <FlatList
        data={RECOMMENDED_FEEDS}
        renderItem={({item}) => <Item {...item} />}
        keyExtractor={item => item.did + item.rkey}
        style={{flex: 1}}
      />
    </TitleColumnLayout>
  )
})

const Item = observer(({did, rkey}: {did: string; rkey: string}) => {
  const pal = usePalette('default')
  const uri = makeRecordUri(did, 'app.bsky.feed.generator', rkey)
  const item = useCustomFeed(uri)
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
            flexDirection: 'row',
            gap: 18,
            maxWidth: 670,
            borderRightWidth: 1,
            paddingHorizontal: 24,
            paddingVertical: 24,
            borderTopWidth: 1,
          },
        ]}>
        <View style={{marginTop: 2}}>
          <UserAvatar type="algo" size={42} avatar={item.data.avatar} />
        </View>
        <View>
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
              style={[pal.text, {maxWidth: 550, marginBottom: 18}]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 16,
    justifyContent: 'space-between',
  },
  title1: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'right',
  },
  title2: {
    fontSize: 58,
    fontWeight: '800',
    textAlign: 'right',
  },
  description: {
    maxWidth: 400,
    marginTop: 10,
    marginLeft: 'auto',
    textAlign: 'right',
  },
})
