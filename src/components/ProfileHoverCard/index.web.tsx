import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs, moderateProfile, ModerationOpts} from '@atproto/api'
import {flip, offset, shift, size, useFloating} from '@floating-ui/react-dom'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
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

type State = 'hidden' | 'might-show' | 'showing' | 'might-hide' | 'hiding'

const SHOW_DELAY = 350
const SHOW_DURATION = 300
const HIDE_DELAY = 200
const HIDE_DURATION = 200

export function ProfileHoverCardInner(props: ProfileHoverCardProps) {
  const [state, setState] = React.useState<State>('hidden')
  const {refs, floatingStyles} = useFloating({
    middleware: floatingMiddlewares,
  })
  const animationStyle = {
    animation:
      state === 'hiding'
        ? `avatarHoverFadeOut ${HIDE_DURATION}ms both`
        : `avatarHoverFadeIn ${SHOW_DURATION}ms both`,
  }

  const prefetchProfileQuery = usePrefetchProfileQuery()
  const prefetchedProfile = React.useRef(false)
  const prefetchIfNeeded = React.useCallback(async () => {
    if (!prefetchedProfile.current) {
      prefetchProfileQuery(props.did)
    }
  }, [prefetchProfileQuery, props.did])

  const isVisible =
    state === 'showing' || state === 'might-hide' || state === 'hiding'

  // We need at most one timeout at a time (to transition to the next state).
  const nextTimeout = React.useRef<NodeJS.Timeout | null>(null)
  const transitionToState = React.useCallback((nextState: State) => {
    if (nextTimeout.current) {
      clearTimeout(nextTimeout.current)
      nextTimeout.current = null
    }
    setState(nextState)
  }, [])

  const onReadyToShow = useNonReactiveCallback(() => {
    if (state === 'might-show') {
      transitionToState('showing')
    }
  })

  const onReadyToHide = useNonReactiveCallback(() => {
    if (state === 'might-hide') {
      transitionToState('hiding')
      nextTimeout.current = setTimeout(onHidingAnimationEnd, HIDE_DURATION)
    }
  })

  const onHidingAnimationEnd = useNonReactiveCallback(() => {
    if (state === 'hiding') {
      transitionToState('hidden')
    }
  })

  const onReceiveHover = useNonReactiveCallback(() => {
    prefetchIfNeeded()
    if (state === 'hidden') {
      transitionToState('might-show')
      nextTimeout.current = setTimeout(onReadyToShow, SHOW_DELAY)
    } else if (state === 'might-show') {
      // Do nothing
    } else if (state === 'showing') {
      // Do nothing
    } else if (state === 'might-hide') {
      transitionToState('showing')
    } else if (state === 'hiding') {
      transitionToState('showing')
    }
  })

  const onLoseHover = useNonReactiveCallback(() => {
    if (state === 'hidden') {
      // Do nothing
    } else if (state === 'might-show') {
      transitionToState('hidden')
    } else if (state === 'showing') {
      transitionToState('might-hide')
      nextTimeout.current = setTimeout(onReadyToHide, HIDE_DELAY)
    } else if (state === 'might-hide') {
      // Do nothing
    } else if (state === 'hiding') {
      // Do nothing
    }
  })

  const onPointerEnterTarget = React.useCallback(() => {
    onReceiveHover()
  }, [onReceiveHover])

  const onPointerLeaveTarget = React.useCallback(() => {
    onLoseHover()
  }, [onLoseHover])

  const onPointerEnterCard = React.useCallback(() => {
    onReceiveHover()
  }, [onReceiveHover])

  const onPointerLeaveCard = React.useCallback(() => {
    onLoseHover()
  }, [onLoseHover])

  const onDismiss = React.useCallback(() => {
    transitionToState('hidden')
  }, [transitionToState])

  return (
    <div
      ref={refs.setReference}
      onPointerEnter={onPointerEnterTarget}
      onPointerLeave={onPointerLeaveTarget}
      onMouseUp={onDismiss}
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
              <Card did={props.did} hide={onDismiss} />
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
