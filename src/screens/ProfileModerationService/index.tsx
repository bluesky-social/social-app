import React from 'react'
import {View} from 'react-native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {AppBskyModerationDefs} from '@atproto/api'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useSafeAreaFrame} from 'react-native-safe-area-context'

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

import {getLabelGroupsFromLabels} from '#/lib/moderation'

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

export function ProfileModserviceScreen(
  props: NativeStackScreenProps<CommonNavigatorParams, 'ProfileModservice'>,
) {
  const t = useTheme()
  const {_} = useLingui()
  const {height: minHeight} = useSafeAreaFrame()
  const {name: handleOrDid} = props.route.params
  const {
    isLoading: isDidResolutionLoading,
    error: didResolutionError,
    data: did,
  } = useResolveDidQuery(handleOrDid)
  const {
    isLoading: isPreferencesLoading,
    error: preferencesError,
    data: preferences,
  } = usePreferencesQuery()
  const {
    isLoading: isModServiceLoading,
    error: modServiceError,
    data: modservice,
  } = useModServiceInfoQuery({did})

  const isLoading =
    isDidResolutionLoading || isPreferencesLoading || isModServiceLoading
  const error = didResolutionError || preferencesError || modServiceError

  return (
    <CenteredView>
      <View
        style={[
          a.border_l,
          a.border_r,
          t.atoms.border_contrast_low,
          {
            minHeight,
          },
        ]}>
        {isLoading ? (
          <View style={[a.w_full, a.align_center]}>
            <Loader size="xl" />
          </View>
        ) : error || !(did && preferences && modservice) ? (
          <ErrorState
            error={
              error?.toString() ||
              _(msg`Something went wrong, please try again.`)
            }
          />
        ) : (
          <ProfileModserviceScreenInner
            preferences={preferences}
            modservice={modservice}
          />
        )}
      </View>
    </CenteredView>
  )
}

export function ProfileModserviceScreenInner({
  preferences,
  modservice,
}: {
  preferences: UsePreferencesQueryResponse
  modservice: AppBskyModerationDefs.ModServiceViewDetailed
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {height: minHeight} = useSafeAreaFrame()
  const pal = usePalette('default')
  const {hasSession} = useSession()
  const {track} = useAnalytics()
  const {mutateAsync: likeMod, isPending: isLikePending} = useLikeMutation()
  const {mutateAsync: unlikeMod, isPending: isUnlikePending} =
    useUnlikeMutation()
  const [likeUri, setLikeUri] = React.useState<string>(
    modservice.viewer?.like || '',
  )
  const isLiked = !!likeUri
  const groups = React.useMemo(() => {
    return getLabelGroupsFromLabels(modservice.policies.labelValues).filter(
      def => def.configurable,
    )
  }, [modservice.policies.labelValues])
  const modservicePreferences = React.useMemo(() => {
    return preferences.moderationOpts.mods.find(
      p => p.did === modservice.creator.did,
    )
  }, [modservice.creator.did, preferences.moderationOpts.mods])

  useSetTitle(modservice.creator.displayName || modservice.creator.handle)

  const onToggleLiked = React.useCallback(async () => {
    try {
      Haptics.default()

      if (isLiked && likeUri) {
        await unlikeMod({uri: likeUri})
        track('CustomFeed:Unlike')
        setLikeUri('')
      } else {
        const res = await likeMod({uri: modservice.uri, cid: modservice.cid})
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
  }, [likeUri, isLiked, modservice, likeMod, unlikeMod, track, _])

  return (
    <ScrollView
      scrollEventThrottle={1}
      contentContainerStyle={{
        minHeight,
        borderWidth: 0,
        paddingHorizontal: a.px_xl.paddingLeft,
      }}>
      <Header modservice={modservice} preferences={preferences} />

      <View style={[a.gap_md, a.pb_xl]}>
        {modservice.description ? (
          <RichText
            testID="modinfoDescription"
            resolveFacets
            value={modservice.description}
            style={[a.text_md, a.leading_normal]}
          />
        ) : (
          <Text
            style={[
              a.text_md,
              a.leading_normal,
              t.atoms.text_contrast_medium,
              {fontStyle: 'italic'},
            ]}>
            <Trans>
              Moderation service managed by @{modservice.creator.handle}
            </Trans>
          </Text>
        )}

        <Text
          style={[
            a.text_md,
            a.leading_normal,
            a.italic,
            t.atoms.text_contrast_medium,
          ]}>
          <Trans>
            Operated by{' '}
            <TextLink
              href={makeProfileLink(modservice.creator)}
              text={sanitizeHandle(modservice.creator.handle, '@')}
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
              <Heart fill={t.atoms.text_contrast_medium.color} />
            )}
          </Button>

          {typeof modservice.likeCount === 'number' && (
            <InlineLink to={'#todo'} style={[pal.textLight, s.semiBold]}>
              <Trans>
                Liked by {modservice.likeCount}{' '}
                {pluralize(modservice.likeCount, 'user')}
              </Trans>
            </InlineLink>
          )}
        </View>
      </View>

      <Divider />

      <View style={[a.gap_sm, a.mt_xl]}>
        <Text style={[a.text_md, a.font_bold]}>
          Configure moderation service
        </Text>
        <Text style={[t.atoms.text_contrast_high, a.leading_snug]}>
          This moderation service supports the following types of content.
          Configure which types of content you'd like to respect from this
          service.
        </Text>
      </View>

      <View style={[a.gap_md, a.mt_xl]}>
        {groups.map((def, i) => {
          return (
            <React.Fragment key={def.id}>
              {i !== 0 && <Divider />}
              <PreferenceRow
                labelGroup={def.id}
                modservicePreferences={modservicePreferences}
              />
            </React.Fragment>
          )
        })}
      </View>

      <View style={{height: 100}} />
    </ScrollView>
  )
}
