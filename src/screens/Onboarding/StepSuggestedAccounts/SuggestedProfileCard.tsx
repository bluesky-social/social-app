import {useEffect, useRef} from 'react'
import {View} from 'react-native'
import {type ModerationOpts} from '@atproto/api'

import {atoms as a, useTheme} from '#/alf'
import * as ProfileCard from '#/components/ProfileCard'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'
import type * as bsky from '#/types/bsky'

export default function SuggestedProfileCard({
  profile,
  moderationOpts,
  position,
  category,
  onSeen,
  recId,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  position: number
  category: string | null
  onSeen: (did: string, position: number) => void
  recId?: number | string
}) {
  const t = useTheme()
  const ax = useAnalytics()
  const cardRef = useRef<View>(null)
  const hasTrackedRef = useRef(false)

  useEffect(() => {
    const node = cardRef.current
    if (!node || hasTrackedRef.current) return

    if (IS_WEB && typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        entries => {
          if (entries[0]?.isIntersecting && !hasTrackedRef.current) {
            hasTrackedRef.current = true
            onSeen(profile.did, position)
            observer.disconnect()
          }
        },
        {threshold: 0.5},
      )
      // @ts-ignore - web only
      observer.observe(node)
      return () => observer.disconnect()
    } else {
      // Native: use a short delay to account for initial layout
      const timeout = setTimeout(() => {
        if (!hasTrackedRef.current) {
          hasTrackedRef.current = true
          onSeen(profile.did, position)
        }
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [onSeen, profile.did, position])

  return (
    <View
      ref={cardRef}
      style={[
        a.w_full,
        a.py_lg,
        a.px_xl,
        position !== 0 && a.border_t,
        t.atoms.border_contrast_low,
      ]}>
      <ProfileCard.Outer>
        <ProfileCard.Header>
          <ProfileCard.Avatar
            profile={profile}
            moderationOpts={moderationOpts}
            disabledPreview
          />
          <ProfileCard.NameAndHandle
            profile={profile}
            moderationOpts={moderationOpts}
          />
          <ProfileCard.FollowButton
            profile={profile}
            moderationOpts={moderationOpts}
            withIcon={false}
            logContext="OnboardingSuggestedAccounts"
            onFollow={() => {
              ax.metric('suggestedUser:follow', {
                logContext: 'Onboarding',
                location: 'Card',
                recId,
                position,
                suggestedDid: profile.did,
                category,
                source: 'SuggestedOnboardingUsers',
              })
            }}
          />
        </ProfileCard.Header>
        <ProfileCard.Description profile={profile} numberOfLines={3} />
      </ProfileCard.Outer>
    </View>
  )
}
