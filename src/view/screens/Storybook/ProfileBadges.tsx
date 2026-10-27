import {useState} from 'react'
import {
  type StyleProp,
  StyleSheet,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'

import * as Item from '#/screens/Notifications/components/NotificationItem/Item'
import {atoms as a, platform, ThemeProvider, useAlf, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {ProfileBadges as Badges, type Size} from '#/components/ProfileBadges'
import {H1, H3, Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'

type Names = 'caps' | 'real'
type SpecimenTheme = 'light' | 'dim'

/**
 * Profiles that show badges without any network data: verification comes
 * from `verification`, the bot badge from a self-applied `bot` label.
 */
function createProfile(
  slug: string,
  {
    verified = false,
    verifier = false,
    bot = false,
  }: {verified?: boolean; verifier?: boolean; bot?: boolean},
): bsky.profile.AnyProfileView {
  const did = `did:plc:storybookbadges${slug}` as const
  return {
    did,
    handle: `${slug}.test`,
    labels: bot
      ? [
          {
            src: did,
            uri: `at://${did}/app.bsky.actor.profile/self`,
            val: 'bot',
            cts: '2026-01-01T00:00:00.000Z',
          },
        ]
      : [],
    verification:
      verified || verifier
        ? {
            verifications: [],
            verifiedStatus: verified ? 'valid' : 'none',
            trustedVerifierStatus: verifier ? 'valid' : 'none',
          }
        : undefined,
  }
}

const PROFILES = {
  verified: createProfile('verified', {verified: true}),
  verifier: createProfile('verifier', {verifier: true}),
  bot: createProfile('bot', {bot: true}),
  verifiedBot: createProfile('verifiedbot', {verified: true, bot: true}),
}

/*
 * Caps-only names have no ascenders or descenders, so the ink of the name is
 * exactly baseline to cap height. That makes the badge's offset from the
 * text's optical centre measurable from a screenshot.
 */
const NAMES = {
  caps: {
    short: 'HEXHOLM',
    long: 'HEXHOLM THE EXTREMELY VERBOSE AND LENGTHY NAME',
    rest: ' FOLLOWED YOU',
  },
  real: {
    short: 'Paul Frazee',
    long: 'Paul Frazee the extremely verbose and lengthy display name',
    rest: ' followed you back!',
  },
} as const

/**
 * Narrow enough that the long names wrap on every device, so the badge lands
 * on a later line.
 */
const WRAP_WIDTH = 280

type RowCase = {
  id: string
  /** Where this pattern is used in the app. */
  source: string
  size: Size
  text: StyleProp<TextStyle>
  interactive?: boolean
  profile?: bsky.profile.AnyProfileView
}

/**
 * The text styles and badge sizes the app pairs together when the badges sit
 * beside the name in a row.
 */
const ROW_CASES: RowCase[] = [
  {
    id: 'R1',
    source: 'SearchHistory, RecentChats',
    size: 'xs',
    text: [a.text_xs, a.leading_snug],
  },
  {
    id: 'R2',
    source: 'ChatInvite Card',
    size: 'sm',
    text: [a.text_sm, a.font_medium],
  },
  {
    id: 'R3',
    source: 'Notifications rows, ChatStatusInfo, ComposerReplyTo',
    size: 'sm',
    text: [a.text_md, a.font_semi_bold, a.leading_snug],
  },
  {
    id: 'R4',
    source: 'PostMeta',
    size: 'sm',
    text: [a.text_md, a.font_semi_bold, a.leading_tight],
  },
  {
    id: 'R5',
    source: 'ProfileCard, SearchablePeopleList',
    size: 'md',
    text: [a.text_md, a.font_semi_bold, a.leading_snug],
  },
  {
    id: 'R6',
    source: 'ThreadItemAnchor',
    size: 'md',
    text: [a.text_lg, a.font_semi_bold, a.leading_snug],
    interactive: true,
  },
  {
    id: 'R7',
    source: 'Drawer',
    size: 'lg',
    text: [a.text_xl, a.font_bold, a.leading_tight],
  },
  {
    id: 'R8',
    source: 'MessagesListInfoPanel',
    size: 'lg',
    text: [a.text_2xl, a.font_bold],
  },
  {
    id: 'R9',
    source: 'Settings (without its offsets)',
    size: 'xl',
    text: [a.text_3xl, a.font_bold],
    interactive: true,
  },
]

const COMBO_CASES: RowCase[] = [
  {
    id: 'C1',
    source: 'verifier',
    size: 'sm',
    text: [a.text_md, a.font_semi_bold, a.leading_snug],
    profile: PROFILES.verifier,
  },
  {
    id: 'C2',
    source: 'verified + bot',
    size: 'sm',
    text: [a.text_md, a.font_semi_bold, a.leading_snug],
    profile: PROFILES.verifiedBot,
  },
  {
    id: 'C3',
    source: 'bot only',
    size: 'sm',
    text: [a.text_md, a.font_semi_bold, a.leading_snug],
    profile: PROFILES.bot,
  },
  {
    id: 'C4',
    source: 'verified + bot, interactive',
    size: 'md',
    text: [a.text_lg, a.font_semi_bold, a.leading_snug],
    profile: PROFILES.verifiedBot,
    interactive: true,
  },
  {
    id: 'C5',
    source: 'verified + bot, interactive',
    size: 'lg',
    text: [a.text_3xl, a.font_bold, a.leading_tight],
    profile: PROFILES.verifiedBot,
    interactive: true,
  },
]

type CallSiteCase = {
  id: string
  source: string
  size: Size
  row: StyleProp<ViewStyle>
  text: StyleProp<TextStyle>
  badge?: StyleProp<ViewStyle>
  interactive?: boolean
}

/**
 * Call sites with their own layout around the badges, mirrored so each one
 * can be checked.
 */
const CALL_SITE_CASES: CallSiteCase[] = [
  {
    id: 'S1',
    source: 'AccountList',
    size: 'sm',
    row: [a.flex_row, a.align_center, a.gap_xs],
    text: [a.font_medium, a.leading_tight, a.text_md],
  },
  {
    id: 'S2',
    source: 'Autocomplete',
    size: 'sm',
    row: [a.flex_row, a.align_center, a.gap_xs],
    text: [a.text_md, a.font_semi_bold, a.leading_snug],
    badge: [{marginTop: platform({android: -2})}],
  },
  {
    id: 'S3',
    source: 'ProfileHoverCard',
    size: 'md',
    row: [a.flex_row, a.align_center, a.pt_md, a.pb_xs],
    text: [a.text_lg, a.leading_snug, a.font_semi_bold, a.self_start],
    badge: [a.pl_xs],
  },
  {
    id: 'S4',
    source: 'ProfileCard name',
    size: 'md',
    row: [a.flex_row, a.align_end, a.flex_shrink],
    text: [a.font_semi_bold, a.leading_tight, a.flex_shrink_0],
    badge: [
      a.pl_2xs,
      a.self_center,
      {marginTop: platform({default: 0, android: -1})},
    ],
  },
  {
    id: 'S5',
    source: 'GroupChatJoinDialog',
    size: 'sm',
    row: [a.flex_row, a.gap_xs, a.align_center, a.justify_center],
    text: [a.flex_shrink, a.text_sm, a.leading_snug, a.font_semi_bold],
  },
  {
    id: 'S6',
    source: 'JoinRequest',
    size: 'sm',
    row: [a.flex_row, a.gap_xs, a.align_center, a.justify_center, a.mb_xs],
    text: [a.text_sm, a.leading_snug, a.font_semi_bold],
  },
  {
    id: 'S7',
    source: 'Settings',
    size: 'xl',
    row: [a.flex_row, a.gap_xs, a.align_center, a.justify_center, a.pt_sm],
    text: [a.text_3xl, a.font_bold],
    interactive: true,
  },
]

/**
 * Alignment lab for `ProfileBadges`. Every specimen mirrors a pattern used in
 * the app, so badge alignment can be compared across platforms, fonts and
 * font scales. Switch names to caps to measure from screenshots.
 */
export function ProfileBadges() {
  const t = useTheme()
  const {fonts} = useAlf()
  const [names, setNames] = useState<Names>('caps')
  const [specimenTheme, setSpecimenTheme] = useState<SpecimenTheme>('light')

  return (
    <View style={[a.gap_md]}>
      <H1>Profile badges</H1>
      <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
        {`Font family: ${fonts.family}, in-app scale: ${fonts.scale} (x${fonts.scaleMultiplier})`}
      </Text>
      <Controls
        options={['system', 'theme'] as const}
        value={fonts.family}
        onChange={fonts.setFontFamily}
        testIDPrefix="badgesFontFamily"
      />
      <Controls
        options={['-1', '0', '1'] as const}
        value={fonts.scale}
        onChange={fonts.setFontScale}
        testIDPrefix="badgesFontScale"
      />
      <Controls
        options={['caps', 'real'] as const}
        value={names}
        onChange={setNames}
        testIDPrefix="badgesNames"
      />
      <Controls
        options={['light', 'dim'] as const}
        value={specimenTheme}
        onChange={setSpecimenTheme}
        testIDPrefix="badgesTheme"
      />

      {/*
       * A nested ThemeProvider reads the font settings once, when it mounts,
       * so remount it whenever they change.
       */}
      <ThemeProvider
        key={`${fonts.family}:${fonts.scale}`}
        theme={specimenTheme}>
        <Specimens names={names} />
      </ThemeProvider>
    </View>
  )
}

function Controls<T extends string>({
  options,
  value,
  onChange,
  testIDPrefix,
}: {
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  testIDPrefix: string
}) {
  return (
    <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
      {options.map(option => (
        <Button
          key={option}
          label={option}
          size="small"
          color={value === option ? 'primary' : 'secondary'}
          testID={`${testIDPrefix}-${option}`}
          onPress={() => onChange(option)}>
          <ButtonText>{option}</ButtonText>
        </Button>
      ))}
    </View>
  )
}

function Specimens({names}: {names: Names}) {
  const t = useTheme()
  const name = NAMES[names]

  return (
    <View
      testID="profileBadgesSpecimens"
      style={[a.gap_xl, a.p_lg, a.rounded_md, t.atoms.bg]}>
      <H3>Beside the name</H3>
      {ROW_CASES.map(c => (
        <RowSpecimen key={c.id} specimen={c} name={name.short} />
      ))}

      <H3>Inline in text</H3>
      <Specimen
        id="I1"
        source="Notifications Name"
        size="sm"
        text="text_md semibold">
        <NotificationNameSpecimen name={name.short} rest={name.rest} />
      </Specimen>
      <Specimen
        id="I2"
        source="Notifications Name, badge on line 2"
        size="sm"
        text="text_md semibold">
        <View style={{maxWidth: WRAP_WIDTH}}>
          <NotificationNameSpecimen name={name.long} rest={name.rest} />
        </View>
      </Specimen>
      <Specimen
        id="I3"
        source="Profile header DisplayName"
        size="lg"
        text="text_3xl bold tight">
        <ProfileHeaderSpecimen name={name.short} />
      </Specimen>
      <Specimen
        id="I4"
        source="Profile header DisplayName, wrapped"
        size="lg"
        text="text_3xl bold tight">
        <View style={{maxWidth: WRAP_WIDTH}}>
          <ProfileHeaderSpecimen name={name.long} />
        </View>
      </Specimen>

      <Specimen
        id="I5"
        source="Real Item.PrimaryText + Item.Name"
        size="sm"
        text="text_md semibold">
        <Item.PrimaryText>
          <Item.Name
            profile={{...PROFILES.verified, displayName: name.short}}
          />
          {name.rest}
        </Item.PrimaryText>
      </Specimen>
      <Specimen
        id="I6"
        source="Real Item.PrimaryText + Item.Name, wrapped"
        size="sm"
        text="text_md semibold">
        <View style={{maxWidth: WRAP_WIDTH}}>
          <Item.PrimaryText>
            <Item.Name
              profile={{...PROFILES.verified, displayName: name.long}}
            />
            {name.rest}
          </Item.PrimaryText>
        </View>
      </Specimen>

      <H3>Combinations</H3>
      {COMBO_CASES.map(c => (
        <RowSpecimen key={c.id} specimen={c} name={name.short} />
      ))}

      <H3>Truncated</H3>
      <Specimen
        id="T1"
        source="numberOfLines=1, narrow"
        size="sm"
        text="text_md semibold snug">
        <View style={[a.flex_row, a.align_center, {maxWidth: 200}]}>
          <Text
            emoji
            numberOfLines={1}
            style={[
              a.flex_shrink,
              a.text_md,
              a.font_semi_bold,
              a.leading_snug,
              t.atoms.text,
            ]}>
            {name.long}
          </Text>
          <Badges profile={PROFILES.verified} size="sm" style={[a.pl_2xs]} />
        </View>
      </Specimen>

      <CallSites name={name.short} />
    </View>
  )
}

function CallSites({name}: {name: string}) {
  const t = useTheme()
  return (
    <>
      <H3>Call sites</H3>
      {CALL_SITE_CASES.map(c => (
        <Specimen
          key={c.id}
          id={c.id}
          source={c.source}
          size={c.size}
          text={describeTextStyle(c.text)}>
          <View style={c.row}>
            <Text emoji numberOfLines={1} style={[t.atoms.text, c.text]}>
              {name}
            </Text>
            <Badges
              profile={PROFILES.verified}
              size={c.size}
              interactive={c.interactive}
              style={c.badge}
            />
          </View>
        </Specimen>
      ))}
    </>
  )
}

function Specimen({
  id,
  source,
  size,
  text,
  children,
}: {
  id: string
  source: string
  size: Size
  text: string
  children: React.ReactNode
}) {
  const t = useTheme()
  return (
    <View testID={`profileBadgesSpecimen-${id}`} style={[a.gap_xs]}>
      <SpecimenMarker index={SPECIMEN_ORDER.indexOf(id) + 1} />
      {/* Labels are red so screenshot analysis can ignore them */}
      <Text style={[a.text_2xs, {color: t.palette.negative_500}]}>
        {`${id} · ${size} · ${text} · ${source}`}
      </Text>
      {children}
    </View>
  )
}

/**
 * Specimen order, which `SpecimenMarker` encodes for screenshot analysis.
 */
const SPECIMEN_ORDER = [
  ...ROW_CASES.map(c => c.id),
  'I1',
  'I2',
  'I3',
  'I4',
  'I5',
  'I6',
  ...COMBO_CASES.map(c => c.id),
  'T1',
  ...CALL_SITE_CASES.map(c => c.id),
]

/**
 * A row of green squares, one per position in `SPECIMEN_ORDER`, so a script
 * can tell which specimen a band of a screenshot belongs to without reading
 * the label.
 */
function SpecimenMarker({index}: {index: number}) {
  return (
    <View style={[a.flex_row, {gap: 2}]}>
      {Array.from({length: index}, (_, i) => (
        <View
          key={i}
          style={{width: 4, height: 4, backgroundColor: '#00c000'}}
        />
      ))}
    </View>
  )
}

function describeTextStyle(style: StyleProp<TextStyle>) {
  return Object.entries(StyleSheet.flatten(style) ?? {})
    .map(([key, value]) => `${key}:${String(value)}`)
    .join(' ')
}

function RowSpecimen({specimen: c, name}: {specimen: RowCase; name: string}) {
  const t = useTheme()
  return (
    <Specimen
      id={c.id}
      source={c.interactive ? `${c.source} (interactive)` : c.source}
      size={c.size}
      text={describeTextStyle(c.text)}>
      <View style={[a.flex_row, a.align_center]}>
        <Text
          emoji
          numberOfLines={1}
          style={[a.flex_shrink, t.atoms.text, c.text]}>
          {name}
        </Text>
        <Badges
          profile={c.profile ?? PROFILES.verified}
          size={c.size}
          interactive={c.interactive}
          style={[a.pl_xs]}
        />
      </View>
    </Specimen>
  )
}

/**
 * Mirrors `Name` inside `Item.PrimaryText` in Notifications v2.
 */
function NotificationNameSpecimen({name, rest}: {name: string; rest: string}) {
  const t = useTheme()
  return (
    <Text emoji style={[a.text_md, a.leading_snug, t.atoms.text]}>
      <Text
        emoji
        style={[a.text_md, a.leading_snug, a.font_semi_bold, t.atoms.text]}>
        {name}
        <Badges profile={PROFILES.verified} size="sm" inline />
      </Text>
      {rest}
    </Text>
  )
}

/**
 * Mirrors `ProfileHeaderDisplayName`.
 */
function ProfileHeaderSpecimen({name}: {name: string}) {
  const t = useTheme()
  return (
    <Text
      emoji
      style={[
        t.atoms.text,
        a.text_3xl,
        a.self_start,
        a.font_bold,
        a.leading_tight,
      ]}>
      {name}
      <Badges
        profile={PROFILES.verified}
        size="lg"
        interactive
        inline
        style={[a.pl_xs]}
      />{' '}
    </Text>
  )
}
