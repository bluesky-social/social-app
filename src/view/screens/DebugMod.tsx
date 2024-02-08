import React from 'react'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {View} from 'react-native'
import {
  LABELS,
  LABEL_GROUPS,
  mock,
  moderatePost,
  moderateProfile,
  PostModeration,
  ProfileModeration,
  ModerationUI,
  LabelPreference,
  AppBskyActorDefs,
  AppBskyFeedDefs,
} from '@atproto/api'

import {atoms as a, useTheme} from '#/alf'
import {CenteredView, ScrollView} from '#/view/com/util/Views'
import {H1, H3, P} from '#/components/Typography'
import {useLabelStrings} from '#/lib/moderation'
import * as Toggle from '#/components/forms/Toggle'
import * as ToggleButton from '#/components/forms/ToggleButton'
import {UserAvatar} from '../com/util/UserAvatar'

import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {PostHider} from '../com/util/moderation/PostHider'
import {PostAlerts} from '../com/util/moderation/PostAlerts'
import {ContentHider} from '../com/util/moderation/ContentHider'
import {ProfileHeader} from '../com/profile/ProfileHeader'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {ProfileCardPills} from '../com/profile/ProfileCard'

const LABEL_VALUES: (keyof typeof LABELS)[] = Object.keys(
  LABELS,
) as (keyof typeof LABELS)[]

const MOCK_MOD_OPTS = {
  userDid: 'at://did:web:alice',
  adultContentEnabled: true,
  labelGroups: {},
  labelers: [
    {
      labeler: {did: 'did:plc:fake-labeler'},
      labelGroups: Object.fromEntries(
        Object.keys(LABEL_GROUPS).map(key => [key, 'hide' as LabelPreference]),
      ),
    },
  ],
}

export const DebugModScreen = ({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'DebugMod'
>) => {
  const t = useTheme()
  const [label, setLabel] = React.useState<string[]>([LABEL_VALUES[0]])
  const [target, setTarget] = React.useState<string[]>(['account'])
  const labelStrings = useLabelStrings()

  const profile = React.useMemo(() => {
    const mockedProfile = mock.profileViewBasic({
      handle: `bob.test`,
      displayName: 'Bob Robertson',
      labels:
        target[0] === 'account'
          ? [
              mock.label({
                val: label[0],
                uri: `at://did:web:bob/`,
              }),
            ]
          : target[0] === 'profile'
          ? [
              mock.label({
                val: label[0],
                uri: `at://did:web:bob/app.bsky.actor.profile/self`,
              }),
            ]
          : undefined,
      viewer: mock.actorViewerState({
        muted: false,
        mutedByList: undefined,
        blockedBy: undefined,
        blocking: undefined,
        blockingByList: undefined,
      }),
    })
    mockedProfile.avatar = 'https://bsky.social/about/images/favicon-32x32.png'
    mockedProfile.banner =
      'https://bsky.social/about/images/social-card-default-gradient.png'
    return mockedProfile
  }, [target, label])

  const post = React.useMemo(() => {
    return mock.postView({
      record: mock.post({
        text: "This is the body of the post. It's where the text goes. You get the idea.",
      }),
      author: profile,
      labels:
        target[0] === 'post'
          ? [
              mock.label({
                val: label[0],
                uri: `at://bob.test/app.bsky.feed.post/fake`,
              }),
            ]
          : undefined,
      embed: mock.embedRecordView({
        record: mock.post({
          text: 'Embed',
        }),
        labels:
          target[0] === 'embed'
            ? [
                mock.label({
                  val: label[0],
                  uri: `at://bob.test/app.bsky.feed.post/fake`,
                }),
              ]
            : undefined,
        author: profile,
      }),
    })
  }, [label, target, profile])

  const profileModeration = React.useMemo(
    () => moderateProfile(profile, MOCK_MOD_OPTS),
    [profile],
  )
  const postModeration = React.useMemo(
    () => moderatePost(post, MOCK_MOD_OPTS),
    [post],
  )

  console.log(post, profile)
  console.log(profileModeration, postModeration)

  return (
    <ScrollView>
      <CenteredView style={[t.atoms.bg, a.px_lg, a.py_lg]}>
        <H1 style={a.pb_lg}>Moderation states</H1>

        <H3 style={a.pb_md}>Target</H3>
        <View style={a.pb_2xl}>
          <ToggleButton.Group
            label="Preferences"
            values={target}
            onChange={setTarget}>
            <ToggleButton.Button name="account" label="Account">
              Account
            </ToggleButton.Button>
            <ToggleButton.Button name="profile" label="Profile">
              Profile
            </ToggleButton.Button>
            <ToggleButton.Button name="post" label="Post">
              Post
            </ToggleButton.Button>
            <ToggleButton.Button name="embed" label="Embed">
              Embed
            </ToggleButton.Button>
          </ToggleButton.Group>
        </View>

        <H3 style={a.pb_md}>Label</H3>
        <Toggle.Group
          label="Toggle"
          type="radio"
          values={label}
          onChange={setLabel}>
          <View style={[a.flex_row, a.gap_md, a.flex_wrap, a.pb_2xl]}>
            {LABEL_VALUES.map(labelValue => (
              <Toggle.Item
                key={labelValue}
                name={labelValue}
                label={labelStrings[labelValue].general.name}>
                <Toggle.Radio />
                <Toggle.Label>{labelValue}</Toggle.Label>
              </Toggle.Item>
            ))}
          </View>
        </Toggle.Group>

        <H3 style={a.pb_md}>Post</H3>
        <MockPost label={label[0]} post={post} moderation={postModeration} />
        <View
          style={[
            t.atoms.bg_contrast_50,
            a.px_md,
            a.py_sm,
            a.rounded_sm,
            a.flex_col,
            a.gap_xs,
            a.mb_2xl,
          ]}>
          <ModerationUIView mod={postModeration.avatar} label="Avatar" />
          <ModerationUIView mod={postModeration.content} label="Content" />
          <ModerationUIView mod={postModeration.embed} label="Embed" />
        </View>

        <H3 style={a.pb_md}>
          Account{' '}
          <H3 style={[t.atoms.text_contrast_500, a.text_lg]}>in listing</H3>
        </H3>
        <MockAccountCard
          label={label[0]}
          profile={profile}
          moderation={profileModeration}
        />
        <View
          style={[
            t.atoms.bg_contrast_50,
            a.px_md,
            a.py_sm,
            a.rounded_sm,
            a.flex_col,
            a.gap_xs,
            a.mb_2xl,
          ]}>
          <ModerationUIView mod={profileModeration.avatar} label="Avatar" />
          <ModerationUIView mod={profileModeration.account} label="Account" />
          <ModerationUIView mod={profileModeration.profile} label="Profile" />
        </View>

        <H3 style={a.pb_md}>
          Account{' '}
          <H3 style={[t.atoms.text_contrast_500, a.text_lg]}>
            viewing directly
          </H3>
        </H3>
        <MockAccountScreen
          label={label[0]}
          profile={profile}
          moderation={profileModeration}
          postModeration={postModeration}
        />
        <View
          style={[
            t.atoms.bg_contrast_50,
            a.px_md,
            a.py_sm,
            a.rounded_sm,
            a.flex_col,
            a.gap_xs,
            a.mb_2xl,
          ]}>
          <ModerationUIView mod={profileModeration.avatar} label="Avatar" />
          <ModerationUIView mod={profileModeration.account} label="Account" />
          <ModerationUIView mod={profileModeration.profile} label="Profile" />
        </View>

        <View style={{height: 400}} />
      </CenteredView>
    </ScrollView>
  )
}

function MockPost({
  label,
  post,
  moderation,
}: {
  label: string
  post: AppBskyFeedDefs.PostView
  moderation: PostModeration
}) {
  const t = useTheme()
  return (
    <View style={[t.atoms.border, a.border, a.rounded_md, a.mb_md, a.p_2xs]}>
      {' '}
      <PostHider
        key={label}
        href="#"
        moderation={moderation.content}
        iconSize={38}
        iconStyles={{marginLeft: 2, marginRight: 2}}
        style={[a.px_lg, a.py_lg, a.rounded_md]}>
        <View style={[a.flex_row, a.gap_md]}>
          <UserAvatar
            size={64}
            avatar={post.author.avatar}
            moderation={moderation.avatar}
          />
          <View style={[a.flex_1]}>
            <View style={[a.flex_row]}>
              <P style={[a.font_bold]}>Bob Robertson </P>
              <P style={t.atoms.text_contrast_500}>
                @bob.bsky.social &middot; 5m
              </P>
            </View>

            <PostAlerts moderation={moderation.content} />

            <P style={a.mb_lg}>
              This is the body of the post. It's where the text goes. You get
              the idea.
            </P>

            <ContentHider
              moderation={moderation.embed}
              moderationDecisions={moderation.decisions}>
              <View
                style={[
                  t.atoms.border,
                  a.border,
                  a.rounded_md,
                  a.flex_col,
                  a.gap_xs,
                  a.px_xl,
                  a.py_xl,
                ]}>
                <View style={[a.flex_row]}>
                  <P style={[a.font_bold]}>Bob Robertson </P>
                  <P style={t.atoms.text_contrast_500}>
                    @bob.bsky.social &middot; 5m
                  </P>
                </View>
                <PostAlerts moderation={moderation.embed} />
                <P>Embedded content</P>
              </View>
            </ContentHider>
          </View>
        </View>
      </PostHider>
    </View>
  )
}

function MockAccountCard({
  label,
  profile,
  moderation,
}: {
  label: string
  profile: AppBskyActorDefs.ProfileViewBasic
  moderation: ProfileModeration
}) {
  const t = useTheme()
  return (
    <View
      key={label}
      style={[
        t.atoms.border,
        a.border,
        a.rounded_md,
        a.flex_row,
        a.gap_md,
        a.px_lg,
        a.py_md,
        a.mb_md,
      ]}>
      <UserAvatar
        size={64}
        avatar={profile.avatar}
        moderation={moderation.avatar}
      />
      <View style={[a.flex_1]}>
        <P style={[a.font_bold]}>
          {sanitizeDisplayName('Bob Robertson', moderation.profile)}{' '}
        </P>
        <P style={t.atoms.text_contrast_500}>@bob.bsky.social</P>
        <P>Thought leader or something.</P>
        <ProfileCardPills followedBy={false} moderation={moderation} />
      </View>
    </View>
  )
}

function MockAccountScreen({
  label,
  profile,
  moderation,
}: {
  label: string
  profile: AppBskyActorDefs.ProfileViewBasic
  moderation: ProfileModeration
}) {
  const t = useTheme()
  return (
    <View key={label} style={[t.atoms.border, a.border, a.mb_md]}>
      <ProfileHeader
        // @ts-ignore ProfileViewBasic is close enough -prf
        profile={profile}
        moderation={moderation}
      />

      {/*
      <UserBanner />
      <View
        style={[
          a.absolute,
          t.atoms.bg,
          a.rounded_full,
          {top: 100, left: 10, width: 100, height: 100, padding: 2},
        ]}>
        <UserAvatar size={96} moderation={moderation.avatar} />
      </View>
      <View
        style={[
          a.pb_2xl,
          a.px_xl,
          t.atoms.border,
          a.border_b,
          {paddingTop: 60},
        ]}>
        <H3>Bob Robertson</H3>
        <P style={t.atoms.text_contrast_500}>@bob.bsky.social</P>
        <P>Thought leader or something.</P>
      </View>
      */}
    </View>
  )
}

function ModerationUIView({mod, label}: {mod: ModerationUI; label: string}) {
  return (
    <View style={[a.flex_row, a.gap_md]}>
      <P style={[a.font_bold, a.text_xs, {width: 60}]}>{label}:</P>
      <Flag v={mod.filter} label="Filter" />
      <Flag v={mod.blur} label="Blur" />
      <Flag v={mod.alert} label="Alert" />
      <Flag v={mod.noOverride} label="No-override" />
    </View>
  )
}

function Flag({v, label}: {v: boolean | undefined; label: string}) {
  const t = useTheme()
  return (
    <View style={[a.flex_row, a.align_center, a.gap_xs]}>
      <View
        style={[
          a.justify_center,
          a.align_center,
          a.rounded_xs,
          a.border,
          t.atoms.border,
          {
            backgroundColor: v ? t.palette.black : t.palette.white,
            width: 14,
            height: 14,
          },
        ]}>
        {v && <Check size="xs" fill={t.palette.white} />}
      </View>
      <P style={a.text_xs}>{label}</P>
    </View>
  )
}
