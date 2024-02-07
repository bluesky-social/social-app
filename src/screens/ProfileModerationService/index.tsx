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
import {Button as OldButton} from 'view/com/util/forms/Button'
import {Text as RNText} from 'view/com/util/text/Text'
import {RichText} from 'view/com/util/text/RichText'
import {ModServicePrefs} from '#/view/com/moderation/ModServicePrefs'
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
import {sanitizeHandle} from '#/lib/strings/handles'

import {useTheme, atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {Loader} from '#/components/Loader'
import {Button, ButtonText} from '#/components/Button'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'

import {ErrorState} from '#/screens/ProfileModerationService/ErrorState'
import {Header} from '#/screens/ProfileModerationService/Header'

// TODO
const MIN_HEIGHT = Dimensions.get('window').height * 1.5
// TODO loader default color

export function ProfileModserviceScreen(
  props: NativeStackScreenProps<CommonNavigatorParams, 'ProfileModservice'>,
) {
  const t = useTheme()
  const {_} = useLingui()
  const {name: handleOrDid} = props.route.params
  const {isLoading, error, data: resolvedDid} = useResolveDidQuery(handleOrDid)

  return (
    <CenteredView>
      <View
        style={[
          a.pt_2xl,
          a.px_xl,
          a.border_l,
          a.border_r,
          t.atoms.border,
          {
            minHeight: MIN_HEIGHT,
          },
        ]}>
        {isLoading ? (
          <View style={[a.w_full, a.align_center]}>
            <Loader size="xl" fill={t.atoms.text.color} />
          </View>
        ) : resolvedDid ? (
          <ProfileModservicecreenIntermediate modDid={resolvedDid} />
        ) : (
          <ErrorState
            error={
              error?.toString() ||
              _(msg`Something went wrong, please try again.`)
            }
          />
        )}
      </View>
    </CenteredView>
  )
}

function ProfileModservicecreenIntermediate({modDid}: {modDid: string}) {
  const t = useTheme()
  const {_} = useLingui()
  const {
    isLoading: isPreferencesLoading,
    error: preferencesError,
    data: preferences,
  } = usePreferencesQuery()
  const {
    isLoading: isModServiceLoading,
    error: modServiceError,
    data: info,
  } = useModServiceInfoQuery({did: modDid})

  const isLoading = isPreferencesLoading || isModServiceLoading
  const error = preferencesError || modServiceError

  return isLoading ? (
    <View style={[a.w_full, a.align_center]}>
      <Loader size="xl" fill={t.atoms.text.color} />
    </View>
  ) : preferences && info ? (
    <ProfileModserviceScreenInner preferences={preferences} modInfo={info} />
  ) : (
    <ErrorState
      error={
        error?.toString() || _(msg`Something went wrong, please try again.`)
      }
    />
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
        <Header info={modInfo} />
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
            <RNText type="lg" style={[{fontStyle: 'italic'}, pal.textLight]}>
              <Trans>No description</Trans>
            </RNText>
          )}
          <RNText type="lg" style={pal.textLight}>
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
          </RNText>

          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            <OldButton
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
            </OldButton>
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
