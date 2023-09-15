import React from 'react'
import {ActivityIndicator, FlatList, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {TabletOrDesktop, Mobile} from 'view/com/util/layouts/Breakpoints'
import {Text} from 'view/com/util/text/Text'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {TitleColumnLayout} from 'view/com/util/layouts/TitleColumnLayout'
import {Button} from 'view/com/util/forms/Button'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {SuggestedActorsModel} from 'state/models/discovery/suggested-actors'
import {RecommendedFollowsItem} from './RecommendedFollowsItem'

type Props = {
  next: () => void
}
export const RecommendedFollows = observer(function RecommendedFollowsImpl({
  next,
}: Props) {
  const store = useStores()
  const suggestedActors = React.useMemo<SuggestedActorsModel>(
    () => new SuggestedActorsModel(store, {withSetup: true}),
    [store],
  )
  const pal = usePalette('default')
  const {isTabletOrMobile} = useWebMediaQueries()
  React.useEffect(() => {
    if (!suggestedActors.hasLoaded) {
      suggestedActors.loadMore(true)
    }
  }, [suggestedActors])

  const title = (
    <>
      <Text
        style={[
          pal.textLight,
          tdStyles.title1,
          isTabletOrMobile && tdStyles.title1Small,
        ]}>
        Follow some
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
        Users
      </Text>
      <Text type="2xl-medium" style={[pal.textLight, tdStyles.description]}>
        Follow some users to get started. We can recommend you more users based
        on who you find interesting.
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
          testID="recommendedFollowsOnboarding"
          title={title}
          horizontal
          titleStyle={isTabletOrMobile ? undefined : {minWidth: 470}}
          contentStyle={{paddingHorizontal: 0}}>
          {suggestedActors.isLoading ? (
            <ActivityIndicator size="large" />
          ) : (
            <FlatList
              data={suggestedActors.suggestions}
              renderItem={({item}) => <RecommendedFollowsItem item={item} />}
              keyExtractor={item => item.did}
              style={{flex: 1}}
            />
          )}
        </TitleColumnLayout>
      </TabletOrDesktop>

      <Mobile>
        <View style={[mStyles.container]} testID="recommendedFollowsOnboarding">
          <ViewHeader
            title="Recommended Follows"
            showBackButton={false}
            showOnDesktop
          />
          <Text type="lg-medium" style={[pal.text, mStyles.header]}>
            Check out some recommended users. Follow them to see similar users.
          </Text>
          {suggestedActors.isLoading ? (
            <ActivityIndicator size="large" />
          ) : (
            <FlatList
              data={suggestedActors.suggestions}
              renderItem={({item}) => <RecommendedFollowsItem item={item} />}
              keyExtractor={item => item.did}
              style={{flex: 1}}
            />
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
