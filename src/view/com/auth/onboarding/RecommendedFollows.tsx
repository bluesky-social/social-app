import React from 'react'
import {ActivityIndicator, FlatList, StyleSheet, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {AppBskyActorDefs, moderateProfile} from '@atproto/api'
import {TabletOrDesktop, Mobile} from 'view/com/util/layouts/Breakpoints'
import {Text} from 'view/com/util/text/Text'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {TitleColumnLayout} from 'view/com/util/layouts/TitleColumnLayout'
import {Button} from 'view/com/util/forms/Button'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {usePalette} from 'lib/hooks/usePalette'
import {RecommendedFollowsItem} from './RecommendedFollowsItem'
import {useSuggestedFollowsQuery} from '#/state/queries/suggested-follows'
import {useGetSuggestedFollowersByActor} from '#/state/queries/suggested-follows'
import {useModerationOpts} from '#/state/queries/preferences'
import {logger} from '#/logger'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

type Props = {
  next: () => void
}
export function RecommendedFollows({next}: Props) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {isTabletOrMobile} = useWebMediaQueries()
  const {data: suggestedFollows} = useSuggestedFollowsQuery()
  const getSuggestedFollowsByActor = useGetSuggestedFollowersByActor()
  const [additionalSuggestions, setAdditionalSuggestions] = React.useState<{
    [did: string]: AppBskyActorDefs.ProfileView[]
  }>({})
  const existingDids = React.useRef<string[]>([])
  const moderationOpts = useModerationOpts()

  const title = (
    <>
      <Trans>
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
      </Trans>
      <Text type="2xl-medium" style={[pal.textLight, tdStyles.description]}>
        <Trans>
          Follow some users to get started. We can recommend you more users
          based on who you find interesting.
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
              <Trans context="action">Done</Trans>
            </Text>
            <FontAwesomeIcon icon="angle-right" color="#fff" size={14} />
          </View>
        </Button>
      </View>
    </>
  )

  const suggestions = React.useMemo(() => {
    if (!suggestedFollows) return []

    const additional = Object.entries(additionalSuggestions)
    const items = suggestedFollows.pages.flatMap(page => page.actors)

    outer: while (additional.length) {
      const additionalAccount = additional.shift()

      if (!additionalAccount) break

      const [followedUser, relatedAccounts] = additionalAccount

      for (let i = 0; i < items.length; i++) {
        if (items[i].did === followedUser) {
          items.splice(i + 1, 0, ...relatedAccounts)
          continue outer
        }
      }
    }

    existingDids.current = items.map(i => i.did)

    return items
  }, [suggestedFollows, additionalSuggestions])

  const onFollowStateChange = React.useCallback(
    async ({following, did}: {following: boolean; did: string}) => {
      if (following) {
        try {
          const {suggestions: results} = await getSuggestedFollowsByActor(did)

          if (results.length) {
            const deduped = results.filter(
              r => !existingDids.current.find(did => did === r.did),
            )
            setAdditionalSuggestions(s => ({
              ...s,
              [did]: deduped.slice(0, 3),
            }))
          }
        } catch (e) {
          logger.error('RecommendedFollows: failed to get suggestions', {
            message: e,
          })
        }
      }

      // not handling the unfollow case
    },
    [existingDids, getSuggestedFollowsByActor, setAdditionalSuggestions],
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
          {!suggestedFollows || !moderationOpts ? (
            <ActivityIndicator size="large" />
          ) : (
            <FlatList
              data={suggestions}
              renderItem={({item}) => (
                <RecommendedFollowsItem
                  profile={item}
                  onFollowStateChange={onFollowStateChange}
                  moderation={moderateProfile(item, moderationOpts)}
                />
              )}
              keyExtractor={item => item.did}
              style={{flex: 1}}
            />
          )}
        </TitleColumnLayout>
      </TabletOrDesktop>

      <Mobile>
        <View style={[mStyles.container]} testID="recommendedFollowsOnboarding">
          <View>
            <ViewHeader
              title={_(msg`Recommended Users`)}
              showBackButton={false}
              showOnDesktop
            />
            <Text type="lg-medium" style={[pal.text, mStyles.header]}>
              <Trans>
                Check out some recommended users. Follow them to see similar
                users.
              </Trans>
            </Text>
          </View>
          {!suggestedFollows || !moderationOpts ? (
            <ActivityIndicator size="large" />
          ) : (
            <FlatList
              data={suggestions}
              renderItem={({item}) => (
                <RecommendedFollowsItem
                  profile={item}
                  onFollowStateChange={onFollowStateChange}
                  moderation={moderateProfile(item, moderationOpts)}
                />
              )}
              keyExtractor={item => item.did}
              style={{flex: 1}}
            />
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
