import React from 'react'
import {ActivityIndicator, StyleProp, View, ViewStyle} from 'react-native'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'

import {AppBskyActorDefs, ModerationOpts, moderateProfile} from '@atproto/api'

import {flip, offset, shift, size, useFloating} from '@floating-ui/react-dom'

import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {usePrefetchProfileQuery, useProfileQuery} from '#/state/queries/profile'

import {usePalette} from '#/lib/hooks/usePalette'
import {makeProfileLink} from '#/lib/routes/links'
import {useModerationOpts} from '#/state/queries/preferences'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {isInvalidHandle, sanitizeHandle} from '#/lib/strings/handles'
import {s} from '#/lib/styles'

import {Portal} from '#/components/Portal'
import {Link} from './Link'
import {UserAvatar} from './UserAvatar'
import {Text} from './text/Text'
import {ThemedText} from './text/ThemedText'

interface UserPreviewLinkProps {
  did: string
  handle: string
  style?: StyleProp<ViewStyle>
}
export function UserPreviewLink(
  props: React.PropsWithChildren<UserPreviewLinkProps>,
) {
  const prefetchProfileQuery = usePrefetchProfileQuery()

  const [hovered, setHovered] = React.useState(false)

  const {refs, floatingStyles} = useFloating({
    middleware: [
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
    ],
  })

  const onPointerEnter = React.useCallback(() => {
    prefetchProfileQuery(props.did)
    setHovered(true)
  }, [props.did, prefetchProfileQuery, setHovered])

  const onPointerLeave = React.useCallback(() => {
    setHovered(false)
  }, [])

  return (
    <div
      ref={refs.setReference}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={onPointerLeave}>
      <Link
        href={makeProfileLink(props)}
        title={props.handle}
        asAnchor
        style={props.style}>
        {props.children}
      </Link>

      {hovered && (
        <Portal>
          <Animated.View
            entering={FadeIn.duration(80)}
            exiting={FadeOut.duration(80)}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              onPointerEnter={onPointerEnter}
              onPointerLeave={onPointerLeave}>
              <HoverProfileCard did={props.did} />
            </div>
          </Animated.View>
        </Portal>
      )}
    </div>
  )
}

interface HoverProfileCardProps {
  did: string
  // onPointerEnter: () => void
  // onPointerLeave: () => void
}

function HoverProfileCard({
  did,
}: // onPointerEnter,
// onPointerLeave,
HoverProfileCardProps) {
  const pal = usePalette('default')

  const profile = useProfileQuery({did})
  const moderationOpts = useModerationOpts()

  const data = profile.data

  return (
    <View
      style={[
        pal.view,
        pal.border,
        {
          // @ts-ignore web only
          boxShadow: 'rgba(0, 0, 0, 0.3) 0px 5px 20px',
          width: 300,
          overflow: 'hidden',
          borderWidth: 1,
          borderRadius: 6,
          padding: 16,
        },
      ]}>
      {data && moderationOpts ? (
        <Profile profile={data} moderationOpts={moderationOpts} />
      ) : (
        <>
          <ActivityIndicator />
        </>
      )}
    </View>
  )
}

function Profile({
  profile,
  moderationOpts,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
  moderationOpts: ModerationOpts
}) {
  const {_} = useLingui()
  const pal = usePalette('default')

  const moderation = React.useMemo(
    () => moderateProfile(profile, moderationOpts),
    [profile, moderationOpts],
  )

  const invalidHandle = isInvalidHandle(profile.handle)
  const blockHide = profile.viewer?.blocking || profile.viewer?.blockedBy

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}>
        <UserAvatar
          size={64}
          avatar={profile.avatar}
          moderation={moderation.avatar}
        />
      </View>

      <View style={{marginTop: 8}}>
        <Text type="xl-medium" style={pal.text}>
          {sanitizeDisplayName(
            profile.displayName || sanitizeHandle(profile.handle),
            moderation.profile,
          )}
        </Text>
      </View>
      <View style={{flexDirection: 'row'}} pointerEvents="none">
        {profile.viewer?.followedBy && !blockHide ? (
          <View
            style={[
              {borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2},
              pal.btn,
              s.mr5,
            ]}>
            <Text type="xs" style={[pal.text]}>
              <Trans>Follows you</Trans>
            </Text>
          </View>
        ) : undefined}
        <ThemedText
          type={invalidHandle ? 'xs' : 'md'}
          fg={invalidHandle ? 'error' : 'light'}
          border={invalidHandle ? 'error' : undefined}
          style={[
            invalidHandle
              ? {borderWidth: 1, borderRadius: 4, paddingHorizontal: 4}
              : undefined,
            {
              // @ts-ignore web only -prf
              wordBreak: 'break-all',
            },
          ]}>
          {invalidHandle ? _(msg`⚠Invalid Handle`) : `@${profile.handle}`}
        </ThemedText>
      </View>
    </View>
  )
}
