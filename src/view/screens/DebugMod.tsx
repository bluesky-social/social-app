import React from 'react'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {View} from 'react-native'
import {
  LABELS,
  mock,
  moderatePost,
  moderateProfile,
  ModerationOpts,
  AppBskyActorDefs,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  LabelTarget,
  LabelPreference,
  ModerationDecision,
  ModerationBehavior,
  RichText,
} from '@atproto/api'
import {moderationOptsOverrideContext} from '#/state/queries/preferences'
import {useSession} from '#/state/session'

import {atoms as a, useTheme} from '#/alf'
import {CenteredView, ScrollView} from '#/view/com/util/Views'
import {H1, H3, P, Text} from '#/components/Typography'
import {useLabelStrings} from '#/lib/moderation/useLabelStrings'
import * as Toggle from '#/components/forms/Toggle'
import * as ToggleButton from '#/components/forms/ToggleButton'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronBottom,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronTop,
} from '#/components/icons/Chevron'
import {ScreenHider} from '../com/util/moderation/ScreenHider'
import {ProfileHeader} from '../com/profile/ProfileHeader'
import {ProfileCard} from '../com/profile/ProfileCard'
import {FeedItem} from '../com/posts/FeedItem'
import {PostThreadItem} from '../com/post-thread/PostThreadItem'

const LABEL_VALUES: (keyof typeof LABELS)[] = Object.keys(
  LABELS,
) as (keyof typeof LABELS)[]

const MOCK_MOD_OPTS = {
  userDid: '',
  adultContentEnabled: true,
  labelGroups: {},
  mods: [
    {
      did: 'did:plc:fake-labeler',
      enabled: true,
    },
  ],
}

export const DebugModScreen = ({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'DebugMod'
>) => {
  const t = useTheme()
  const [scenario, setScenario] = React.useState<string[]>(['label'])
  const [scenarioSwitches, setScenarioSwitches] = React.useState<string[]>([])
  const [label, setLabel] = React.useState<string[]>([LABEL_VALUES[0]])
  const [target, setTarget] = React.useState<string[]>(['account'])
  const [visibility, setVisiblity] = React.useState<string[]>(['hide'])
  const labelStrings = useLabelStrings()
  const {currentAccount} = useSession()

  const isTargetMe =
    scenario[0] === 'label' && scenarioSwitches.includes('targetMe')
  const isSelfLabel =
    scenario[0] === 'label' && scenarioSwitches.includes('selfLabel')
  const noAdult =
    scenario[0] === 'label' && scenarioSwitches.includes('noAdult')
  const isLoggedOut =
    scenario[0] === 'label' && scenarioSwitches.includes('loggedOut')

  const did =
    isTargetMe && currentAccount ? currentAccount.did : 'did:web:bob.test'

  const profile = React.useMemo(() => {
    const mockedProfile = mock.profileViewBasic({
      handle: `bob.test`,
      displayName: 'Bob Robertson',
      description: 'User with this as their bio',
      labels:
        scenario[0] === 'label' && target[0] === 'account'
          ? [
              mock.label({
                src: isSelfLabel ? did : undefined,
                val: label[0],
                uri: `at://${did}/`,
              }),
            ]
          : scenario[0] === 'label' && target[0] === 'profile'
          ? [
              mock.label({
                src: isSelfLabel ? did : undefined,
                val: label[0],
                uri: `at://${did}/app.bsky.actor.profile/self`,
              }),
            ]
          : undefined,
      viewer: mock.actorViewerState({
        muted: scenario[0] === 'mute',
        mutedByList: undefined,
        blockedBy: undefined,
        blocking:
          scenario[0] === 'block'
            ? `at://did:web:alice.test/app.bsky.actor.block/fake`
            : undefined,
        blockingByList: undefined,
      }),
    })
    mockedProfile.did = did
    mockedProfile.avatar = 'https://bsky.social/about/images/favicon-32x32.png'
    mockedProfile.banner =
      'https://bsky.social/about/images/social-card-default-gradient.png'
    return mockedProfile
  }, [scenario, target, label, isSelfLabel, did])

  const post = React.useMemo(() => {
    return mock.postView({
      record: mock.post({
        text: "This is the body of the post. It's where the text goes. You get the idea.",
      }),
      author: profile,
      labels:
        scenario[0] === 'label' && target[0] === 'post'
          ? [
              mock.label({
                src: isSelfLabel ? did : undefined,
                val: label[0],
                uri: `at:/${did}/app.bsky.feed.post/fake`,
              }),
            ]
          : undefined,
      embed:
        target[0] === 'embed'
          ? mock.embedRecordView({
              record: mock.post({
                text: 'Embed',
              }),
              labels:
                scenario[0] === 'label' && target[0] === 'embed'
                  ? [
                      mock.label({
                        src: isSelfLabel ? did : undefined,
                        val: label[0],
                        uri: `at://${did}/app.bsky.feed.post/fake`,
                      }),
                    ]
                  : undefined,
              author: profile,
            })
          : {
              $type: 'app.bsky.embed.images#view',
              images: [
                {
                  thumb:
                    'https://bsky.social/about/images/social-card-default-gradient.png',
                  fullsize:
                    'https://bsky.social/about/images/social-card-default-gradient.png',
                  alt: '',
                },
              ],
            },
    })
  }, [scenario, label, target, profile, isSelfLabel, did])

  const modOpts = React.useMemo(() => {
    return {
      ...MOCK_MOD_OPTS,
      userDid: isLoggedOut ? '' : isTargetMe ? did : 'did:web:alice.test',
      adultContentEnabled: !noAdult,
      labelGroups: {
        [LABELS[label[0] as keyof typeof LABELS].groupId]:
          visibility[0] as LabelPreference,
      },
    }
  }, [label, visibility, noAdult, isLoggedOut, isTargetMe, did])

  const profileModeration = React.useMemo(() => {
    return moderateProfile(profile, modOpts)
  }, [profile, modOpts])
  const postModeration = React.useMemo(() => {
    return moderatePost(post, modOpts)
  }, [post, modOpts])

  return (
    <moderationOptsOverrideContext.Provider value={modOpts}>
      <ScrollView>
        <CenteredView style={[t.atoms.bg, a.px_lg, a.py_lg]}>
          <H1 style={[a.text_5xl, a.font_bold, a.pb_lg]}>Moderation states</H1>

          <Heading title="Config" />

          <Heading title="" subtitle="Scenario" />
          <ToggleButton.Group
            label="Scenario"
            values={scenario}
            onChange={setScenario}>
            <ToggleButton.Button name="label" label="Label">
              Label
            </ToggleButton.Button>
            <ToggleButton.Button name="block" label="Block">
              Block
            </ToggleButton.Button>
            <ToggleButton.Button name="mute" label="Mute">
              Mute
            </ToggleButton.Button>
          </ToggleButton.Group>

          {scenario[0] === 'label' && (
            <>
              <Toggle.Group
                label="Toggle"
                type="checkbox"
                values={scenarioSwitches}
                onChange={setScenarioSwitches}>
                <View style={[a.gap_md, a.flex_row, a.pt_md]}>
                  <Toggle.Item name="targetMe" label="Target is me">
                    <Toggle.Checkbox />
                    <Toggle.Label>Target is me</Toggle.Label>
                  </Toggle.Item>
                  <Toggle.Item name="selfLabel" label="Self label">
                    <Toggle.Checkbox />
                    <Toggle.Label>Self label</Toggle.Label>
                  </Toggle.Item>
                  <Toggle.Item name="noAdult" label="Adult disabled">
                    <Toggle.Checkbox />
                    <Toggle.Label>Adult disabled</Toggle.Label>
                  </Toggle.Item>
                  <Toggle.Item name="loggedOut" label="Logged out">
                    <Toggle.Checkbox />
                    <Toggle.Label>Logged out</Toggle.Label>
                  </Toggle.Item>
                </View>
              </Toggle.Group>
              <View style={{height: 10}} />

              <Heading title="" subtitle="Target" />
              <ToggleButton.Group
                label="Target"
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

              <View style={{height: 10}} />

              <Heading title="" subtitle="Preference" />
              <ToggleButton.Group
                label="Visiblity"
                values={visibility}
                onChange={setVisiblity}>
                <ToggleButton.Button name="hide" label="Hide">
                  Hide
                </ToggleButton.Button>
                <ToggleButton.Button name="warn" label="Warn">
                  Warn
                </ToggleButton.Button>
                <ToggleButton.Button name="ignore" label="Ignore">
                  Ignore
                </ToggleButton.Button>
              </ToggleButton.Group>

              <View style={{height: 10}} />

              <Heading title="" subtitle="Label" />
              <Toggle.Group
                label="Toggle"
                type="radio"
                values={label}
                onChange={setLabel}>
                <View style={[a.flex_row, a.gap_md, a.flex_wrap]}>
                  {LABEL_VALUES.map(labelValue => {
                    let targetFixed = target[0]
                    if (
                      targetFixed !== 'account' &&
                      targetFixed !== 'profile'
                    ) {
                      targetFixed = 'content'
                    }
                    const disabled =
                      !LABELS[labelValue].targets.includes(
                        targetFixed as LabelTarget,
                      ) ||
                      (isSelfLabel &&
                        LABELS[labelValue].flags.includes('no-self'))
                    return (
                      <Toggle.Item
                        key={labelValue}
                        name={labelValue}
                        label={labelStrings[labelValue].general.name}
                        disabled={disabled}
                        style={disabled ? {opacity: 0.5} : undefined}>
                        <Toggle.Radio />
                        <Toggle.Label>{labelValue}</Toggle.Label>
                      </Toggle.Item>
                    )
                  })}
                </View>
              </Toggle.Group>
            </>
          )}

          <Spacer />

          <ModerationUIView
            label="Profile Moderation UI"
            mod={profileModeration}
          />
          <ModerationUIView label="Post Moderation UI" mod={postModeration} />
          <DataView
            label={label[0]}
            data={LABELS[label[0] as keyof typeof LABELS]}
          />
          <DataView label="Profile Moderation Data" data={profileModeration} />
          <DataView label="Post Data" data={postModeration} />

          <Spacer />

          <Heading title="Post" subtitle="in feed" />
          <MockPostFeedItem post={post} moderation={postModeration} />

          <Spacer />

          <Heading title="Post" subtitle="viewed directly" />
          <MockPostThreadItem post={post} moderation={postModeration} />

          <Spacer />

          <Heading title="Post" subtitle="reply in thread" />
          <MockPostThreadItem post={post} moderation={postModeration} reply />

          <Spacer />

          <Heading title="Notification" subtitle="quote or reply" />
          <P>TODO</P>

          <Spacer />

          {(target[0] === 'account' || target[0] === 'profile') && (
            <>
              <Heading title="Notification" subtitle="follow or like" />
              <P>TODO</P>

              <Spacer />

              <Heading title="Account" subtitle="in listing" />
              <MockAccountCard
                profile={profile}
                moderation={profileModeration}
              />

              <Spacer />

              <Heading title="Account" subtitle="viewing directly" />
              <MockAccountScreen
                profile={profile}
                moderation={profileModeration}
                moderationOpts={modOpts}
              />
            </>
          )}

          <View style={{height: 400}} />
        </CenteredView>
      </ScrollView>
    </moderationOptsOverrideContext.Provider>
  )
}

function Heading({title, subtitle}: {title: string; subtitle?: string}) {
  const t = useTheme()
  return (
    <H3 style={[a.text_3xl, a.font_bold, a.pb_md]}>
      {title}{' '}
      {!!subtitle && (
        <H3 style={[t.atoms.text_contrast_medium, a.text_lg]}>{subtitle}</H3>
      )}
    </H3>
  )
}

function Toggler({label, children}: React.PropsWithChildren<{label: string}>) {
  const t = useTheme()
  const [show, setShow] = React.useState(false)
  return (
    <View style={a.mb_md}>
      <View
        style={[
          t.atoms.border_contrast_medium,
          a.border,
          a.rounded_sm,
          a.p_xs,
        ]}>
        <Button
          variant="solid"
          color="secondary"
          label="Toggle visibility"
          size="small"
          onPress={() => setShow(!show)}>
          <ButtonText>{label}</ButtonText>
          <ButtonIcon
            icon={show ? ChevronTop : ChevronBottom}
            position="right"
          />
        </Button>
        {show && children}
      </View>
    </View>
  )
}

function DataView({label, data}: {label: string; data: any}) {
  return (
    <Toggler label={label}>
      <Text style={[{fontFamily: 'monospace'}, a.p_md]}>
        {JSON.stringify(data, null, 2)}
      </Text>
    </Toggler>
  )
}

function ModerationUIView({
  mod,
  label,
}: {
  mod: ModerationDecision
  label: string
}) {
  return (
    <Toggler label={label}>
      <View style={a.p_lg}>
        {[
          'profileList',
          'profileView',
          'avatar',
          'banner',
          'displayName',
          'contentList',
          'contentView',
          'contentMedia',
        ].map(key => {
          const ui = mod.ui(key as keyof ModerationBehavior)
          return (
            <View key={key} style={[a.flex_row, a.gap_md]}>
              <Text style={[a.font_bold, {width: 100}]}>{key}</Text>
              <Flag v={ui.filter} label="Filter" />
              <Flag v={ui.blur} label="Blur" />
              <Flag v={ui.alert} label="Alert" />
              <Flag v={ui.inform} label="Inform" />
              <Flag v={ui.noOverride} label="No-override" />
            </View>
          )
        })}
      </View>
    </Toggler>
  )
}

function Spacer() {
  return <View style={{height: 30}} />
}

function MockPostFeedItem({
  post,
  moderation,
}: {
  post: AppBskyFeedDefs.PostView
  moderation: ModerationDecision
}) {
  const t = useTheme()
  if (moderation.ui('contentList').filter) {
    return (
      <P style={[t.atoms.bg_contrast_50, a.px_lg, a.py_md]}>
        Filtered from the feed
      </P>
    )
  }
  return (
    <FeedItem
      post={post}
      record={post.record as AppBskyFeedPost.Record}
      moderation={moderation}
      reason={undefined}
    />
  )
}

function MockPostThreadItem({
  post,
  reply,
}: {
  post: AppBskyFeedDefs.PostView
  moderation: ModerationDecision
  reply?: boolean
}) {
  return (
    <PostThreadItem
      // @ts-ignore
      post={post}
      record={post.record as AppBskyFeedPost.Record}
      depth={reply ? 1 : 0}
      isHighlightedPost={!reply}
      treeView={false}
      prevPost={undefined}
      nextPost={undefined}
      hasPrecedingItem={false}
      onPostReply={() => {}}
    />
  )
}

function MockAccountCard({
  profile,
  moderation,
}: {
  profile: AppBskyActorDefs.ProfileViewBasic
  moderation: ModerationDecision
}) {
  const t = useTheme()

  if (moderation.ui('profileList').filter) {
    return (
      <P style={[t.atoms.bg_contrast_50, a.px_lg, a.py_md]}>
        Filtered from the listing
      </P>
    )
  }

  return <ProfileCard profile={profile} />
}

function MockAccountScreen({
  profile,
  moderation,
  moderationOpts,
}: {
  profile: AppBskyActorDefs.ProfileViewBasic
  moderation: ModerationDecision
  moderationOpts: ModerationOpts
}) {
  const t = useTheme()
  return (
    <View style={[t.atoms.border_contrast_medium, a.border, a.mb_md]}>
      <ScreenHider
        style={{}}
        screenDescription="profile"
        modui={moderation.ui('profileView')}>
        <ProfileHeader
          // @ts-ignore ProfileViewBasic is close enough -prf
          profile={profile}
          moderationOpts={moderationOpts}
          descriptionRT={new RichText({text: profile.description as string})}
        />
      </ScreenHider>
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
          t.atoms.border_contrast_medium,
          {
            backgroundColor: t.palette.contrast_25,
            width: 14,
            height: 14,
          },
        ]}>
        {v && <Check size="xs" fill={t.palette.contrast_900} />}
      </View>
      <P style={a.text_xs}>{label}</P>
    </View>
  )
}
