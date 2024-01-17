import React, {useMemo, useCallback} from 'react'
import {Dimensions, StyleSheet, View, ActivityIndicator} from 'react-native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {useIsFocused, useNavigation} from '@react-navigation/native'
import {AppBskyModerationDefs, RichText as RichTextAPI} from '@atproto/api'
import {usePalette} from 'lib/hooks/usePalette'
import {HeartIcon, HeartIconSolid} from 'lib/icons'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {CommonNavigatorParams} from 'lib/routes/types'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {s} from 'lib/styles'
import {ProfileSubpageHeader} from 'view/com/profile/ProfileSubpageHeader'
import {TextLink} from 'view/com/util/Link'
import {Button} from 'view/com/util/forms/Button'
import {Text} from 'view/com/util/text/Text'
import {RichText} from 'view/com/util/text/RichText'
import {ModServicePrefs} from '../com/moderation/ModServicePrefs'
import * as Toast from 'view/com/util/Toast'
import {useSetTitle} from 'lib/hooks/useSetTitle'
import {Haptics} from 'lib/haptics'
import {useAnalytics} from 'lib/analytics/analytics'
import {makeCustomFeedLink} from 'lib/routes/links'
import {pluralize} from 'lib/strings/helpers'
import {CenteredView, ScrollView} from 'view/com/util/Views'
import {NavigationProp} from 'lib/routes/types'
import {makeProfileLink} from 'lib/routes/links'
import {logger} from '#/logger'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useModalControls} from '#/state/modals'
import {useModServiceInfoQuery} from '#/state/queries/modservice'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {
  UsePreferencesQueryResponse,
  usePreferencesQuery,
} from '#/state/queries/preferences'
import {useSession} from '#/state/session'
import {useLikeMutation, useUnlikeMutation} from '#/state/queries/like'
import {ModServiceHeader} from '../com/moderation/ModServiceHeader'
import {sanitizeHandle} from '#/lib/strings/handles'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileModservice'>
export function ProfileModserviceScreen(props: Props) {
  const {name: handleOrDid} = props.route.params

  const pal = usePalette('default')
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()

  const {error, data: resolvedDid} = useResolveDidQuery(handleOrDid)

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  if (error) {
    return (
      <CenteredView>
        <View style={[pal.view, pal.border, styles.notFoundContainer]}>
          <Text type="title-lg" style={[pal.text, s.mb10]}>
            <Trans>Could not load moderation service</Trans>
          </Text>
          <Text type="md" style={[pal.text, s.mb20]}>
            {error.toString()}
          </Text>

          <View style={{flexDirection: 'row'}}>
            <Button
              type="default"
              accessibilityLabel={_(msg`Go Back`)}
              accessibilityHint="Return to previous page"
              onPress={onPressBack}
              style={{flexShrink: 1}}>
              <Text type="button" style={pal.text}>
                <Trans>Go Back</Trans>
              </Text>
            </Button>
          </View>
        </View>
      </CenteredView>
    )
  }

  return resolvedDid ? (
    <ProfileModservicecreenIntermediate modDid={resolvedDid} />
  ) : (
    <CenteredView>
      <View style={s.p20}>
        <ActivityIndicator size="large" />
      </View>
    </CenteredView>
  )
}

function ProfileModservicecreenIntermediate({modDid}: {modDid: string}) {
  const {data: preferences} = usePreferencesQuery()
  const {data: info} = useModServiceInfoQuery({did: modDid})

  if (!preferences || !info) {
    return (
      <CenteredView>
        <View style={s.p20}>
          <ActivityIndicator size="large" />
        </View>
      </CenteredView>
    )
  }

  return (
    <ProfileModserviceScreenInner preferences={preferences} modInfo={info} />
  )
}

export function ProfileModserviceScreenInner({
  preferences,
  modInfo,
}: {
  preferences: UsePreferencesQueryResponse
  modInfo: AppBskyModerationDefs.ModServiceViewDetailed
}) {
  const {_} = useLingui()
  const pal = usePalette('default')
  const {hasSession} = useSession()
  const {track} = useAnalytics()
  const {mutateAsync: likeMod, isPending: isLikePending} = useLikeMutation()
  const {mutateAsync: unlikeMod, isPending: isUnlikePending} =
    useUnlikeMutation()
  const [likeUri, setLikeUri] = React.useState<string>(
    modInfo.viewer?.like || '',
  )

  const isLiked = !!likeUri
  const isSaved = false // TODO
  // !removedFeed &&
  // (!!savedFeed || preferences.feeds.saved.includes(feedInfo.uri))
  const isEnabled = false // TODO
  // !unpinnedFeed &&
  // (!!pinnedFeed || preferences.feeds.pinned.includes(feedInfo.uri))

  const descriptionRT = useMemo(
    () =>
      modInfo.description
        ? new RichTextAPI({
            text: modInfo.description,
            facets: modInfo.descriptionFacets,
          })
        : undefined,
    [modInfo],
  )

  useSetTitle(modInfo.creator.displayName || modInfo.creator.handle)

  // event handlers
  //
  const onToggleLiked = React.useCallback(async () => {
    try {
      Haptics.default()

      if (isLiked && likeUri) {
        await unlikeMod({uri: likeUri})
        track('CustomFeed:Unlike')
        setLikeUri('')
      } else {
        const res = await likeMod({uri: modInfo.uri, cid: modInfo.cid})
        track('CustomFeed:Like')
        setLikeUri(res.uri)
      }
    } catch (err) {
      Toast.show(
        _(
          msg`There was an an issue contacting the server, please check your internet connection and try again.`,
        ),
      )
      logger.error('Failed up toggle like', {error: err})
    }
  }, [likeUri, isLiked, modInfo, likeMod, unlikeMod, track, _])

  // render
  // =

  return (
    <View style={s.hContentRegion}>
      <ScrollView
        scrollEventThrottle={1}
        contentContainerStyle={{
          minHeight: Dimensions.get('window').height * 1.5,
        }}>
        <ModServiceHeader info={modInfo} />
        <View
          style={[
            {
              borderTopWidth: 1,
              paddingVertical: 20,
              paddingHorizontal: 14,
              gap: 12,
            },
            pal.border,
          ]}>
          {descriptionRT ? (
            <RichText
              testID="modinfoDescription"
              type="lg"
              style={pal.text}
              richText={descriptionRT}
            />
          ) : (
            <Text type="lg" style={[{fontStyle: 'italic'}, pal.textLight]}>
              <Trans>No description</Trans>
            </Text>
          )}
          <Text type="lg" style={pal.textLight}>
            <Trans>
              Operated by{' '}
              <TextLink
                href={makeProfileLink(modInfo.creator)}
                text={sanitizeHandle(modInfo.creator.handle, '@')}
                style={pal.link}
              />
              . Handles reports of anti-social behavior, illegal content,
              unwanted sexual content, and misinformation.
            </Trans>
          </Text>

          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            <Button
              type="default"
              testID="toggleLikeBtn"
              accessibilityLabel={_(msg`Like this feed`)}
              accessibilityHint=""
              disabled={!hasSession || isLikePending || isUnlikePending}
              onPress={onToggleLiked}
              style={{paddingHorizontal: 10}}>
              {isLiked ? (
                <HeartIconSolid size={19} style={s.likeColor} />
              ) : (
                <HeartIcon strokeWidth={3} size={19} style={pal.textLight} />
              )}
            </Button>
            {typeof modInfo.likeCount === 'number' && (
              <TextLink
                href={'#todo'}
                text={_(
                  msg`Liked by ${modInfo.likeCount} ${pluralize(
                    modInfo.likeCount,
                    'user',
                  )}`,
                )}
                style={[pal.textLight, s.semiBold]}
              />
            )}
          </View>
        </View>
        <ModServicePrefs />
        <View style={{height: 20}} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 50,
    marginLeft: 6,
  },
  notFoundContainer: {
    margin: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 6,
  },
})
