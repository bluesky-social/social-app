import {useState} from 'react'
import {Pressable, View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'
import {useQueries} from '@tanstack/react-query'
import chunk from 'lodash.chunk'

import {STALE} from '#/state/queries'
import {profilesQueryKey} from '#/state/queries/profile'
import {useAgent} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import {CheckThick_Stroke2_Corner0_Rounded as CheckThick} from '#/components/icons/Check'
import {Newspaper_Stroke2_Corner2_Rounded as Newspaper} from '#/components/icons/Newspaper'
import * as Layout from '#/components/Layout'
import {ProfileBadges} from '#/components/ProfileBadges'
import {Text} from '#/components/Typography'
import {type NewsSource, selectSources, sourceTagLabels} from '../sources'
import {type NewsFeedPrefs} from '../state/prefs'
import {SetupFooter} from './SetupFooter'
import {SetupHeader} from './SetupHeader'

export function SetupSources({
  draft,
  onChangeExcluded,
  onBack,
  onDone,
}: {
  draft: NewsFeedPrefs
  onChangeExcluded: (next: string[]) => void
  onBack: () => boolean | void
  onDone: () => void
}) {
  const {t: l} = useLingui()
  const [consented, setConsented] = useState(false)

  const sources = selectSources(
    {topics: draft.topics, regions: draft.regions},
    {applyExclusions: false},
  )
  const allDids = sources.map(source => source.did)
  const profiles = useSourceProfiles(allDids)

  const toggle = (did: string) => {
    if (draft.excludedDids.includes(did)) {
      onChangeExcluded(draft.excludedDids.filter(d => d !== did))
    } else {
      onChangeExcluded([...draft.excludedDids, did])
    }
  }

  return (
    <Layout.Screen testID="newsFeedSetupSources">
      <SetupHeader step={2} onBack={onBack} />

      <Layout.Content
        style={[a.flex_1]}
        contentContainerStyle={[{paddingBottom: 220}]}>
        <View style={[a.px_xl, a.pt_lg, a.pb_lg, a.gap_md]}>
          <View style={[a.flex_row, a.gap_sm, a.align_center]}>
            <Newspaper />
            <Text
              style={[a.flex_1, a.text_xl, a.font_semi_bold, a.leading_tight]}>
              <Trans>Review your sources</Trans>
            </Text>
          </View>
          <Text style={[a.text_sm, a.leading_snug]}>
            <Trans>
              These accounts match your topics. Tap to remove any you do not
              want.
            </Trans>
          </Text>
        </View>

        <Divider />

        <View style={[a.px_xl, a.pt_xl, a.pb_lg]}>
          {sources.length === 0 ? (
            <Text style={[a.text_md]}>
              <Trans>No sources match your selected topics yet.</Trans>
            </Text>
          ) : (
            <View
              style={[
                a.flex_row,
                a.flex_wrap,
                a.justify_between,
                {rowGap: 12},
              ]}>
              {sources.map(source => (
                <SourceCard
                  key={source.did}
                  source={source}
                  profile={profiles.get(source.did)}
                  selected={!draft.excludedDids.includes(source.did)}
                  onPress={() => toggle(source.did)}
                />
              ))}
            </View>
          )}
        </View>
      </Layout.Content>

      <SetupFooter>
        <View style={[a.gap_md]}>
          <Toggle.Item
            name="newsFeedConsent"
            label={l`Agree to publish your selections as a public record`}
            value={consented}
            onChange={setConsented}
            style={[a.align_start, a.gap_sm]}>
            <Toggle.Checkbox />
            <Text style={[a.flex_1, a.text_sm, a.leading_snug]}>
              <Trans>
                I understand my topic and source selections will be published as
                a public record linked to my account, and agree to share them.
              </Trans>
            </Text>
          </Toggle.Item>

          <Divider />

          <Button
            testID="newsFeedSourcesDoneBtn"
            label={l`Done`}
            size="large"
            color="primary"
            disabled={!consented}
            onPress={onDone}>
            <ButtonText>
              <Trans>Done</Trans>
            </ButtonText>
          </Button>
        </View>
      </SetupFooter>
    </Layout.Screen>
  )
}

function SourceCard({
  source,
  profile,
  selected,
  onPress,
}: {
  source: NewsSource
  profile?: AppBskyActorDefs.ProfileViewDetailed
  selected: boolean
  onPress: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const tags = sourceTagLabels(source)

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{checked: selected}}
      accessibilityLabel={source.displayName}
      accessibilityHint={l`Toggle whether this source appears in your news feed`}
      onPress={onPress}
      style={[
        {width: '48.5%'},
        a.gap_md,
        a.rounded_md,
        a.border,
        a.p_md,
        t.atoms.border_contrast_low,
        selected ? t.atoms.bg_contrast_25 : {opacity: 0.35},
      ]}>
      <View
        style={[
          a.absolute,
          a.rounded_full,
          a.align_center,
          a.justify_center,
          {top: 8, right: 8, width: 22, height: 22},
          selected
            ? {backgroundColor: t.palette.contrast_500}
            : [a.border, t.atoms.border_contrast_high],
        ]}>
        {selected && <CheckThick width={12} fill={t.palette.white} />}
      </View>

      <UserAvatar
        type="user"
        shape="square"
        size={44}
        avatar={profile?.avatar}
      />
      <View style={[a.gap_2xs]}>
        <View style={[a.flex_row, a.align_center, a.gap_xs]}>
          <Text
            style={[a.text_md, a.font_bold, {flexShrink: 1}]}
            numberOfLines={1}>
            {source.displayName}
          </Text>
          {profile && <ProfileBadges profile={profile} size="sm" />}
        </View>
        <Text
          style={[a.text_sm, t.atoms.text_contrast_medium]}
          numberOfLines={1}>
          @{source.handle}
        </Text>
        <Text
          style={[a.text_sm, {color: t.palette.primary_500}]}
          numberOfLines={1}>
          {tags.join(' · ')}
        </Text>
      </View>
    </Pressable>
  )
}

/**
 * Fetch source profiles for avatars and verification badges. Chunked because
 * `getProfiles` takes at most 25 actors per request; chunks reuse the shared
 * profiles query key so they're cached with the rest of the app's profiles.
 */
function useSourceProfiles(
  dids: string[],
): Map<string, AppBskyActorDefs.ProfileViewDetailed> {
  const agent = useAgent()
  const results = useQueries({
    queries: chunk(dids, 25).map(actors => ({
      enabled: actors.length > 0,
      staleTime: STALE.MINUTES.FIVE,
      queryKey: profilesQueryKey(actors),
      queryFn: async () => {
        const res = await agent.getProfiles({actors})
        return res.data
      },
    })),
  })

  const map = new Map<string, AppBskyActorDefs.ProfileViewDetailed>()
  for (const result of results) {
    for (const profile of result.data?.profiles ?? []) {
      map.set(profile.did, profile)
    }
  }
  return map
}
