import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logEvent} from '#/lib/statsig/statsig'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSuggestedFollowsByActorQuery} from '#/state/queries/suggested-follows'
import {atoms as a, useTheme, ViewStyleProp} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {KnownFollowers} from '#/components/KnownFollowers'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'

function CardOuter({
  children,
  style,
}: {children: React.ReactNode | React.ReactNode[]} & ViewStyleProp) {
  const t = useTheme()
  return (
    <View
      style={[
        a.w_full,
        a.p_lg,
        a.rounded_md,
        a.border,
        t.atoms.bg_contrast_25,
        {
          borderColor: t.atoms.bg_contrast_25.backgroundColor,
        },
        style,
      ]}>
      {children}
    </View>
  )
}

export function SuggestedFollowPlaceholder() {
  const t = useTheme()
  return (
    <CardOuter style={[a.gap_sm, t.atoms.border_contrast_low]}>
      <ProfileCard.Header>
        <ProfileCard.AvatarPlaceholder />
        <ProfileCard.NameAndHandlePlaceholder />
      </ProfileCard.Header>

      <ProfileCard.DescriptionPlaceholder />
    </CardOuter>
  )
}

export type ProfileSuggestedFollowsProps = {
  control: Dialog.DialogOuterProps['control']
  profile: AppBskyActorDefs.ProfileViewDetailed
}

export function SimilarAccountsDialog({
  control,
  profile,
}: ProfileSuggestedFollowsProps) {
  const t = useTheme()
  const {_} = useLingui()
  const [show, setShow] = React.useState(false)
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(msg`Accounts similar to @${profile.handle}`)}>
        {show ? (
          <SimilarAccounts profile={profile} />
        ) : (
          <>
            <Text style={[t.atoms.text, a.text_2xl, a.font_bold, a.mb_sm]}>
              <Trans>Similar accounts</Trans>
            </Text>
            <Text
              style={[
                t.atoms.text_contrast_medium,
                a.text_md,
                a.mb_xl,
                a.leading_snug,
              ]}>
              <Trans>These are accounts similar to @{profile.handle}</Trans>
            </Text>

            <Button
              label={_(msg`View accounts similar to @${profile.handle}`)}
              size="medium"
              variant="solid"
              color="primary"
              onPress={() => {
                setShow(true)
              }}>
              <ButtonText>
                <Trans>See similar accounts?</Trans>
              </ButtonText>
            </Button>
          </>
        )}
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

export function SimilarAccounts({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileViewDetailed
}) {
  const t = useTheme()
  const {isLoading: isSuggestionsLoading, data} =
    useSuggestedFollowsByActorQuery({
      did: profile.did,
    })
  const moderationOpts = useModerationOpts()
  const isLoading = isSuggestionsLoading || !moderationOpts

  return (
    <View>
      <Text style={[t.atoms.text, a.text_2xl, a.font_bold, a.mb_sm]}>
        <Trans>Similar accounts</Trans>
      </Text>
      <Text
        style={[
          t.atoms.text_contrast_medium,
          a.text_md,
          a.mb_xl,
          a.leading_snug,
        ]}>
        <Trans>These are accounts similar to @{profile.handle}</Trans>
      </Text>

      <View style={[a.gap_md]}>
        {isLoading ? (
          <>
            <SuggestedFollowPlaceholder />
            <SuggestedFollowPlaceholder />
            <SuggestedFollowPlaceholder />
            <SuggestedFollowPlaceholder />
            <SuggestedFollowPlaceholder />
          </>
        ) : data ? (
          data.suggestions
            .filter(s => (s.associated?.labeler ? false : true))
            .map(profile => (
              <ProfileCard.Link
                key={profile.did}
                profile={profile}
                onPress={() => {
                  logEvent('profile:header:suggestedFollowsCard:press', {})
                }}
                style={[]}>
                {({hovered, pressed}) => (
                  <CardOuter
                    style={[
                      (hovered || pressed) && t.atoms.border_contrast_medium,
                    ]}>
                    <ProfileCard.Outer>
                      <View style={[a.gap_md]}>
                        <View style={[a.gap_xs]}>
                          <ProfileCard.Header>
                            <ProfileCard.Avatar
                              profile={profile}
                              moderationOpts={moderationOpts}
                            />
                            <ProfileCard.NameAndHandle
                              profile={profile}
                              moderationOpts={moderationOpts}
                            />
                            <ProfileCard.FollowButton
                              profile={profile}
                              moderationOpts={moderationOpts}
                              logContext="ProfileHeaderSuggestedFollows"
                              color="secondary_inverted"
                              shape="round"
                            />
                          </ProfileCard.Header>
                          <ProfileCard.Description
                            profile={profile}
                            numberOfLines={2}
                          />
                        </View>

                        <KnownFollowers
                          minimal
                          profile={profile}
                          moderationOpts={moderationOpts}
                        />
                      </View>
                    </ProfileCard.Outer>
                  </CardOuter>
                )}
              </ProfileCard.Link>
            ))
        ) : (
          <View />
        )}
      </View>
    </View>
  )
}
