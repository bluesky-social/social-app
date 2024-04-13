import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs, moderateProfile, ModerationOpts} from '@atproto/api'
import {flip, offset, shift, size, useFloating} from '@floating-ui/react-dom'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {pluralize} from '#/lib/strings/helpers'
import {useModerationOpts} from '#/state/queries/preferences'
import {usePrefetchProfileQuery, useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useProfileShadow} from 'state/cache/profile-shadow'
import {formatCount} from '#/view/com/util/numeric/format'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {ProfileHeaderHandle} from '#/screens/Profile/Header/Handle'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useFollowMethods} from '#/components/hooks/useFollowMethods'
import {useRichText} from '#/components/hooks/useRichText'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {InlineLinkText, Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Portal} from '#/components/Portal'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import {ProfileHoverCardProps} from './types'

const floatingMiddlewares = [
  offset(4),
  flip({padding: 16}),
  shift({padding: 16}),
  size({
    padding: 16,
    apply({availableWidth, availableHeight, elements}) {
      Object.assign(elements.floating.style, {
        maxWidth: `${availableWidth}px`,
        maxHeight: `${availableHeight}px`,
      })
    },
  }),
]

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

export function ProfileHoverCard(props: ProfileHoverCardProps) {
  return isTouchDevice ? props.children : <ProfileHoverCardInner {...props} />
}

type State = {
  stage: 'hidden' | 'might-show' | 'showing' | 'might-hide' | 'hiding'
  effect?: () => () => any
}

type Action =
  | 'pressed'
  | 'hovered'
  | 'unhovered'
  | 'show-timer-elapsed'
  | 'hide-timer-elapsed'
  | 'hide-animation-completed'

const SHOW_DELAY = 350
const SHOW_DURATION = 300
const HIDE_DELAY = 200
const HIDE_DURATION = 200

export function ProfileHoverCardInner(props: ProfileHoverCardProps) {
  const {refs, floatingStyles} = useFloating({
    middleware: floatingMiddlewares,
  })

  const [currentState, dispatch] = React.useReducer(
    // Tip: console.log(state, action) when debugging.
    (state: State, action: Action): State => {
      // Regardless of which stage we're in, pressing always hides the card.
      if (action === 'pressed') {
        return {stage: 'hidden'}
      }

      if (state.stage === 'hidden') {
        // Our story starts when the card is hidden.
        // If the user hovers, we kick off a grace period before showing the card.
        if (action === 'hovered') {
          return {
            stage: 'might-show',
            effect() {
              const id = setTimeout(
                () => dispatch('show-timer-elapsed'),
                SHOW_DELAY,
              )
              return () => {
                clearTimeout(id)
              }
            },
          }
        }
      }

      if (state.stage === 'might-show') {
        // We're in the grace period when we decide whether to show the card.
        // At this point, two things can happen. Either the user unhovers, and
        // we go back to hidden--or they linger enough that we'll show the card.
        if (action === 'unhovered') {
          return {stage: 'hidden'}
        }
        if (action === 'show-timer-elapsed') {
          return {stage: 'showing'}
        }
      }

      if (state.stage === 'showing') {
        // We're showing the card now.
        // If the user unhovers, we'll start a grace period before hiding the card.
        if (action === 'unhovered') {
          return {
            stage: 'might-hide',
            effect() {
              const id = setTimeout(
                () => dispatch('hide-timer-elapsed'),
                HIDE_DELAY,
              )
              return () => clearTimeout(id)
            },
          }
        }
      }

      if (state.stage === 'might-hide') {
        // We're in the grace period when we decide whether to hide the card.
        // At this point, two things can happen. Either the user hovers, and
        // we go back to showing it--or they linger enough that we'll start hiding the card.
        if (action === 'hovered') {
          return {stage: 'showing'}
        }
        if (action === 'hide-timer-elapsed') {
          return {
            stage: 'hiding',
            effect() {
              const id = setTimeout(
                () => dispatch('hide-animation-completed'),
                HIDE_DURATION,
              )
              return () => clearTimeout(id)
            },
          }
        }
      }

      if (state.stage === 'hiding') {
        // We're currently playing the hiding animation.
        // We'll ignore all inputs now and wait for the animation to finish.
        // At that point, we'll hide the entire thing, going back to square one.
        if (action === 'hide-animation-completed') {
          return {stage: 'hidden'}
        }
      }

      // Something else happened. Keep calm and carry on.
      return state
    },
    {stage: 'hidden'},
  )

  React.useEffect(() => {
    if (currentState.effect) {
      const effect = currentState.effect
      delete currentState.effect // Mark as completed
      return effect()
    }
  }, [currentState])

  const prefetchProfileQuery = usePrefetchProfileQuery()
  const prefetchedProfile = React.useRef(false)
  const prefetchIfNeeded = React.useCallback(async () => {
    if (!prefetchedProfile.current) {
      prefetchedProfile.current = true
      prefetchProfileQuery(props.did)
    }
  }, [prefetchProfileQuery, props.did])

  const onPointerEnterTarget = React.useCallback(() => {
    prefetchIfNeeded()
    dispatch('hovered')
  }, [prefetchIfNeeded])

  const onPointerLeaveTarget = React.useCallback(() => {
    dispatch('unhovered')
  }, [])

  const onPointerEnterCard = React.useCallback(() => {
    dispatch('hovered')
  }, [])

  const onPointerLeaveCard = React.useCallback(() => {
    dispatch('unhovered')
  }, [])

  const onPress = React.useCallback(() => {
    dispatch('pressed')
  }, [])

  const isVisible =
    currentState.stage === 'showing' ||
    currentState.stage === 'might-hide' ||
    currentState.stage === 'hiding'

  const animationStyle = {
    animation:
      currentState.stage === 'hiding'
        ? `avatarHoverFadeOut ${HIDE_DURATION}ms both`
        : `avatarHoverFadeIn ${SHOW_DURATION}ms both`,
  }

  return (
    <div
      ref={refs.setReference}
      onPointerEnter={onPointerEnterTarget}
      onPointerLeave={onPointerLeaveTarget}
      onMouseUp={onPress}
      style={{
        display: props.inline ? 'inline' : 'block',
      }}>
      {props.children}
      {isVisible && (
        <Portal>
          <div style={animationStyle}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              onPointerEnter={onPointerEnterCard}
              onPointerLeave={onPointerLeaveCard}>
              <Card did={props.did} hide={onPress} />
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}

let Card = ({did, hide}: {did: string; hide: () => void}): React.ReactNode => {
  const t = useTheme()

  const profile = useProfileQuery({did})
  const moderationOpts = useModerationOpts()

  const data = profile.data

  return (
    <View
      style={[
        a.p_lg,
        a.border,
        a.rounded_md,
        a.overflow_hidden,
        t.atoms.bg,
        t.atoms.border_contrast_low,
        t.atoms.shadow_lg,
        {
          width: 300,
        },
      ]}>
      {data && moderationOpts ? (
        <Inner profile={data} moderationOpts={moderationOpts} hide={hide} />
      ) : (
        <View style={[a.justify_center]}>
          <Loader size="xl" />
        </View>
      )}
    </View>
  )
}
Card = React.memo(Card)

function Inner({
  profile,
  moderationOpts,
  hide,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  moderationOpts: ModerationOpts
  hide: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const moderation = React.useMemo(
    () => moderateProfile(profile, moderationOpts),
    [profile, moderationOpts],
  )
  const [descriptionRT] = useRichText(profile.description ?? '')
  const profileShadow = useProfileShadow(profile)
  const {follow, unfollow} = useFollowMethods({
    profile: profileShadow,
    logContext: 'ProfileHoverCard',
  })
  const blockHide = profile.viewer?.blocking || profile.viewer?.blockedBy
  const following = formatCount(profile.followsCount || 0)
  const followers = formatCount(profile.followersCount || 0)
  const pluralizedFollowers = pluralize(profile.followersCount || 0, 'follower')
  const profileURL = makeProfileLink({
    did: profile.did,
    handle: profile.handle,
  })
  const isMe = React.useMemo(
    () => currentAccount?.did === profile.did,
    [currentAccount, profile],
  )

  return (
    <View>
      <View style={[a.flex_row, a.justify_between, a.align_start]}>
        <Link to={profileURL} label={_(msg`View profile`)} onPress={hide}>
          <UserAvatar
            size={64}
            avatar={profile.avatar}
            moderation={moderation.ui('avatar')}
          />
        </Link>

        {!isMe && (
          <Button
            size="small"
            color={profileShadow.viewer?.following ? 'secondary' : 'primary'}
            variant="solid"
            label={
              profileShadow.viewer?.following ? _('Following') : _('Follow')
            }
            style={[a.rounded_full]}
            onPress={profileShadow.viewer?.following ? unfollow : follow}>
            <ButtonIcon
              position="left"
              icon={profileShadow.viewer?.following ? Check : Plus}
            />
            <ButtonText>
              {profileShadow.viewer?.following ? _('Following') : _('Follow')}
            </ButtonText>
          </Button>
        )}
      </View>

      <Link to={profileURL} label={_(msg`View profile`)} onPress={hide}>
        <View style={[a.pb_sm, a.flex_1]}>
          <Text style={[a.pt_md, a.pb_xs, a.text_lg, a.font_bold]}>
            {sanitizeDisplayName(
              profile.displayName || sanitizeHandle(profile.handle),
              moderation.ui('displayName'),
            )}
          </Text>

          <ProfileHeaderHandle profile={profileShadow} />
        </View>
      </Link>

      {!blockHide && (
        <>
          <View style={[a.flex_row, a.flex_wrap, a.gap_md, a.pt_xs]}>
            <InlineLinkText
              to={makeProfileLink(profile, 'followers')}
              label={`${followers} ${pluralizedFollowers}`}
              style={[t.atoms.text]}
              onPress={hide}>
              <Trans>
                <Text style={[a.text_md, a.font_bold]}>{followers} </Text>
                <Text style={[t.atoms.text_contrast_medium]}>
                  {pluralizedFollowers}
                </Text>
              </Trans>
            </InlineLinkText>
            <InlineLinkText
              to={makeProfileLink(profile, 'follows')}
              label={_(msg`${following} following`)}
              style={[t.atoms.text]}
              onPress={hide}>
              <Trans>
                <Text style={[a.text_md, a.font_bold]}>{following} </Text>
                <Text style={[t.atoms.text_contrast_medium]}>following</Text>
              </Trans>
            </InlineLinkText>
          </View>

          {profile.description?.trim() && !moderation.ui('profileView').blur ? (
            <View style={[a.pt_md]}>
              <RichText
                numberOfLines={8}
                value={descriptionRT}
                onLinkPress={hide}
              />
            </View>
          ) : undefined}
        </>
      )}
    </View>
  )
}
