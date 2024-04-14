import React from 'react'
import {ActivityIndicator, FlatList, StyleSheet, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useSuggestedFeedsQuery} from '#/state/queries/suggested-feeds'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {ErrorMessage} from 'view/com/util/error/ErrorMessage'
import {Button} from 'view/com/util/forms/Button'
import {Mobile, TabletOrDesktop} from 'view/com/util/layouts/Breakpoints'
import {TitleColumnLayout} from 'view/com/util/layouts/TitleColumnLayout'
import {Text} from 'view/com/util/text/Text'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {RecommendedFeedsItem} from './RecommendedFeedsItem'

type Props = {
  next: () => void
}
export function RecommendedFeeds({next}: Props) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {isTabletOrMobile} = useWebMediaQueries()
  const {isLoading, data} = useSuggestedFeedsQuery()

  const hasFeeds = data && data.pages[0].feeds.length

  const title = (
    <>
      <Trans>
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
          Recommended
        </Text>
        <Text
          style={[
            pal.link,
            tdStyles.title2,
            isTabletOrMobile && tdStyles.title2Small,
          ]}>
          Feeds
        </Text>
      </Trans>
      <Text type="2xl-medium" style={[pal.textLight, tdStyles.description]}>
        <Trans>
          Feeds are created by users to curate content. Choose some feeds that
          you find interesting.
        </Trans>
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
              <Trans>Next</Trans>
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
              data={data.pages[0].feeds}
              renderItem={({item}) => <RecommendedFeedsItem item={item} />}
              keyExtractor={item => item.uri}
              style={{flex: 1}}
            />
          ) : isLoading ? (
            <View>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <ErrorMessage message={_(msg`Failed to load recommended feeds`)} />
          )}
        </TitleColumnLayout>
      </TabletOrDesktop>
      <Mobile>
        <View style={[mStyles.container]} testID="recommendedFeedsOnboarding">
          <ViewHeader
            title={_(msg`Recommended Feeds`)}
            showBackButton={false}
            showOnDesktop
          />
          <Text type="lg-medium" style={[pal.text, mStyles.header]}>
            <Trans>
              Check out some recommended feeds. Tap + to add them to your list
              of pinned feeds.
            </Trans>
          </Text>

          {hasFeeds ? (
            <FlatList
              data={data.pages[0].feeds}
              renderItem={({item}) => <RecommendedFeedsItem item={item} />}
              keyExtractor={item => item.uri}
              style={{flex: 1}}
              showsVerticalScrollIndicator={false}
            />
          ) : isLoading ? (
            <View style={{flex: 1}}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <View style={{flex: 1}}>
              <ErrorMessage
                message={_(msg`Failed to load recommended feeds`)}
              />
            </View>
          )}

          <Button
            onPress={next}
            label={_(msg`Continue`)}
            testID="continueBtn"
            style={mStyles.button}
            labelStyle={mStyles.buttonText}
          />
        </View>
      </Mobile>
    </>
  )
}

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
    alignItems: 'center',
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 18,
    paddingVertical: 4,
  },
})
