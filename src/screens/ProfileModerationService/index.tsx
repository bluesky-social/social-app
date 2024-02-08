import React from 'react'
import {Dimensions, View} from 'react-native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {AppBskyModerationDefs} from '@atproto/api'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {usePalette} from '#/lib/hooks/usePalette'
import {CommonNavigatorParams} from '#/lib/routes/types'
import {s} from '#/lib/styles'
import {TextLink} from '#/view/com/util/Link'
import * as Toast from '#/view/com/util/Toast'
import {useSetTitle} from '#/lib/hooks/useSetTitle'
import {Haptics} from '#/lib/haptics'
import {useAnalytics} from '#/lib/analytics/analytics'
import {pluralize} from '#/lib/strings/helpers'
import {CenteredView, ScrollView} from '#/view/com/util/Views'
import {makeProfileLink} from '#/lib/routes/links'
import {logger} from '#/logger'
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
import {Button} from '#/components/Button'
import {
  Heart2_Stroke2_Corner0_Rounded as Heart,
  Heart2_Filled_Stroke2_Corner0_Rounded as HeartFilled,
} from '#/components/icons/Heart2'
import {RichText} from '#/components/RichText'
import {InlineLink} from '#/components/Link'
import {Divider} from '#/components/Divider'

import {ErrorState} from '#/screens/ProfileModerationService/ErrorState'
import {Header} from '#/screens/ProfileModerationService/Header'
import {PreferenceRow} from '#/screens/ProfileModerationService/PreferenceRow'

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
  // preferences,
  modInfo,
}: {
  preferences: UsePreferencesQueryResponse
  modInfo: AppBskyModerationDefs.ModServiceViewDetailed
}) {
  const t = useTheme()
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
  // const isSaved = false // TODO
  // !removedFeed &&
  // (!!savedFeed || preferences.feeds.saved.includes(feedInfo.uri))
  // const isEnabled = false // TODO
  // !unpinnedFeed &&
  // (!!pinnedFeed || preferences.feeds.pinned.includes(feedInfo.uri))

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

  return (
    <ScrollView
      scrollEventThrottle={1}
      contentContainerStyle={{
        minHeight: Dimensions.get('window').height * 1.5,
        borderWidth: 0,
      }}>
      <Header info={modInfo} />

      <View style={[a.gap_md]}>
        {modInfo.description ? (
          <RichText
            testID="modinfoDescription"
            resolveFacets
            value={modInfo.description}
            style={[a.text_md, a.leading_normal]}
          />
        ) : (
          <Text
            style={[
              a.text_md,
              a.leading_normal,
              t.atoms.text_contrast_700,
              {fontStyle: 'italic'},
            ]}>
            <Trans>No description</Trans>
          </Text>
        )}

        <Text
          style={[
            a.text_md,
            a.leading_normal,
            a.italic,
            t.atoms.text_contrast_700,
          ]}>
          <Trans>
            Operated by{' '}
            <TextLink
              href={makeProfileLink(modInfo.creator)}
              text={sanitizeHandle(modInfo.creator.handle, '@')}
              style={pal.link}
            />
            . Handles reports of anti-social behavior, illegal content, unwanted
            sexual content, and misinformation.
          </Trans>
        </Text>

        <View style={[a.flex_row, a.gap_md, a.align_center]}>
          <Button
            testID="toggleLikeBtn"
            size="small"
            color="secondary"
            variant="solid"
            shape="round"
            label={_(msg`Like this feed`)}
            disabled={!hasSession || isLikePending || isUnlikePending}
            onPress={onToggleLiked}>
            {isLiked ? (
              <HeartFilled fill={t.palette.negative_400} />
            ) : (
              <Heart fill={t.atoms.text_contrast_700.color} />
            )}
          </Button>

          {typeof modInfo.likeCount === 'number' && (
            <InlineLink to={'#todo'} style={[pal.textLight, s.semiBold]}>
              <Trans>
                Liked by {modInfo.likeCount}{' '}
                {pluralize(modInfo.likeCount, 'user')}
              </Trans>
            </InlineLink>
          )}
        </View>
      </View>

      <View style={[a.gap_md, a.mt_xl]}>
        <Divider />
        <PreferenceRow labelGroup="nsfw" />
        <Divider />
        <PreferenceRow labelGroup="nudity" />
        <Divider />
        <PreferenceRow labelGroup="suggestive" />
      </View>

      <View style={{height: 20}} />
    </ScrollView>
  )
}
