import React, {useState, useEffect} from 'react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {AppBskyActorDefs, ModerationOpts, moderateProfile} from '@atproto/api'
import {ThemedText} from '../util/text/ThemedText'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {ProfileHeader} from '../profile/ProfileHeader'
import {InfoCircleIcon} from 'lib/icons'
import {useNavigationState} from '@react-navigation/native'
import {s} from 'lib/styles'
import {useModerationOpts} from '#/state/queries/preferences'
import {useProfileQuery} from '#/state/queries/profile'
import {ErrorScreen} from '../util/error/ErrorScreen'
import {cleanError} from '#/lib/strings/errors'
import {useProfileShadow} from '#/state/cache/profile-shadow'

export const snapPoints = [520, '100%']

export function Component({did}: {did: string}) {
  const moderationOpts = useModerationOpts()
  const {
    data: profile,
    dataUpdatedAt,
    error: profileError,
    refetch: refetchProfile,
    isFetching: isFetchingProfile,
  } = useProfileQuery({
    did: did,
  })

  if (isFetchingProfile || !moderationOpts) {
    return (
      <View style={s.p20}>
        <ActivityIndicator size="large" />
      </View>
    )
  }
  if (profileError) {
    return (
      <ErrorScreen
        title="Oops!"
        message={cleanError(profileError)}
        onPressTryAgain={refetchProfile}
      />
    )
  }
  if (profile && moderationOpts) {
    return (
      <ComponentLoaded
        profile={profile}
        dataUpdatedAt={dataUpdatedAt}
        moderationOpts={moderationOpts}
      />
    )
  }
  // should never happen
  return (
    <ErrorScreen
      title="Oops!"
      message="Something went wrong and we're not sure what."
      onPressTryAgain={refetchProfile}
    />
  )
}

function ComponentLoaded({
  profile: profileUnshadowed,
  dataUpdatedAt,
  moderationOpts,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  dataUpdatedAt: number
  moderationOpts: ModerationOpts
}) {
  const pal = usePalette('default')
  const profile = useProfileShadow(profileUnshadowed, dataUpdatedAt)
  const {screen} = useAnalytics()
  const moderation = React.useMemo(
    () => moderateProfile(profile, moderationOpts),
    [profile, moderationOpts],
  )

  // track the navigator state to detect if a page-load occurred
  const navState = useNavigationState(state => state)
  const [initNavState] = useState(navState)
  const isLoading = initNavState !== navState

  useEffect(() => {
    screen('Profile:Preview')
  }, [screen])

  return (
    <View testID="profilePreview" style={[pal.view, s.flex1]}>
      <View style={[styles.headerWrapper]}>
        <ProfileHeader
          profile={profile}
          moderation={moderation}
          hideBackButton
          isProfilePreview
        />
      </View>
      <View style={[styles.hintWrapper, pal.view]}>
        <View style={styles.hint}>
          {isLoading ? (
            <ActivityIndicator />
          ) : (
            <>
              <InfoCircleIcon size={21} style={pal.textLight} />
              <ThemedText type="xl" fg="light">
                Swipe up to see more
              </ThemedText>
            </>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  headerWrapper: {
    height: 440,
  },
  hintWrapper: {
    height: 80,
  },
  hint: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
})
