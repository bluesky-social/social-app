import React from 'react'
import {ActivityIndicator, FlatList, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {TabletOrDesktop, Mobile} from 'view/com/util/layouts/Breakpoints'
import {Text} from 'view/com/util/text/Text'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {TitleColumnLayout} from 'view/com/util/layouts/TitleColumnLayout'
import {Button} from 'view/com/util/forms/Button'
import {RecommendedFeedsItem} from './RecommendedFeedsItem'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {usePalette} from 'lib/hooks/usePalette'
import {useQuery} from '@tanstack/react-query'
import {useStores} from 'state/index'
import {CustomFeedModel} from 'state/models/feeds/custom-feed'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'

type Props = {
  next: () => void
}
export const RecommendedFeeds = observer(function RecommendedFeedsImpl({
  next,
}: Props) {
  const store = useStores()
  const pal = usePalette('default')
  const {isTabletOrMobile} = useWebMediaQueries()
  const {isLoading, data: recommendedFeeds} = useQuery({
    staleTime: Infinity, // fixed list rn, never refetch
    queryKey: ['onboarding', 'recommended_feeds'],
    async queryFn() {
      try {
        const {
          data: {feeds},
          success,
        } = await store.agent.app.bsky.feed.getSuggestedFeeds()

        if (!success) {
          return []
        }

        return (feeds.length ? feeds : []).map(feed => {
          return new CustomFeedModel(store, feed)
        })
      } catch (e) {
        return []
      }
    },
  })

  const hasFeeds = recommendedFeeds && recommendedFeeds.length

  const title = (
    <>
      <Text
        style={[
          pal.textLight,
          tdStyles.title1,
          isTabletOrMobile && tdStyles.title1Small,
        ]}>
        Choose your
      </Text>
      <Text
        style={[
          pal.link,
          tdStyles.title2,
          isTabletOrMobile && tdStyles.title2Small,
        ]}>
        Recomended
      </Text>
      <Text
        style={[
          pal.link,
          tdStyles.title2,
          isTabletOrMobile && tdStyles.title2Small,
        ]}>
        Feeds
      </Text>
      <Text type="2xl-medium" style={[pal.textLight, tdStyles.description]}>
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
    <>
      <TabletOrDesktop>
        <TitleColumnLayout
          testID="recommendedFeedsOnboarding"
          title={title}
          horizontal
          titleStyle={isTabletOrMobile ? undefined : {minWidth: 470}}
          contentStyle={{paddingHorizontal: 0}}>
          {hasFeeds ? (
            <FlatList
              data={recommendedFeeds}
              renderItem={({item}) => <RecommendedFeedsItem item={item} />}
              keyExtractor={item => item.uri}
              style={{flex: 1}}
            />
          ) : isLoading ? (
            <View>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <ErrorMessage message="Failed to load recommended feeds" />
          )}
        </TitleColumnLayout>
      </TabletOrDesktop>
      <Mobile>
        <View style={[mStyles.container]} testID="recommendedFeedsOnboarding">
          <ViewHeader
            title="Recommended Feeds"
            showBackButton={false}
            showOnDesktop
          />
          <Text type="lg-medium" style={[pal.text, mStyles.header]}>
            Check out some recommended feeds. Tap + to add them to your list of
            pinned feeds.
          </Text>

          {hasFeeds ? (
            <FlatList
              data={recommendedFeeds}
              renderItem={({item}) => <RecommendedFeedsItem item={item} />}
              keyExtractor={item => item.uri}
              style={{flex: 1}}
            />
          ) : isLoading ? (
            <View style={{flex: 1}}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <View style={{flex: 1}}>
              <ErrorMessage message="Failed to load recommended feeds" />
            </View>
          )}

          <Button
            onPress={next}
            label="Continue"
            testID="continueBtn"
            style={mStyles.button}
            labelStyle={mStyles.buttonText}
          />
        </View>
      </Mobile>
    </>
  )
})

const tdStyles = StyleSheet.create({
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
  title1Small: {
    fontSize: 24,
  },
  title2: {
    fontSize: 58,
    fontWeight: '800',
    textAlign: 'right',
  },
  title2Small: {
    fontSize: 36,
  },
  description: {
    maxWidth: 400,
    marginTop: 10,
    marginLeft: 'auto',
    textAlign: 'right',
  },
})

const mStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  button: {
    marginBottom: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 18,
    paddingVertical: 4,
  },
})
