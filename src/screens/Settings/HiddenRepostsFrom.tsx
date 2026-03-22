import {type StyleProp, View, type ViewStyle} from 'react-native'
import {type AppBskyActorDefs as ActorDefs} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {useQueries} from '@tanstack/react-query'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {
  useHiddenRepostsFrom,
  useHiddenRepostsFromApi,
} from '#/state/preferences'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {STALE} from '#/state/queries'
import {profilesQueryKey} from '#/state/queries/profile'
import {useAgent} from '#/state/session'
import {List} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'

const BATCH_SIZE = 25

type Props = NativeStackScreenProps<CommonNavigatorParams, 'HiddenRepostsFrom'>

export function HiddenRepostsFromScreen({}: Props) {
  const {_} = useLingui()
  const t = useTheme()
  const agent = useAgent()
  const moderationOpts = useModerationOpts()
  const hiddenRepostsFrom = useHiddenRepostsFrom()
  const {unhideRepostsFrom} = useHiddenRepostsFromApi()
  const dids = hiddenRepostsFrom ?? []

  // Batch DIDs into chunks of 25 (API limit for getProfiles)
  const batches: string[][] = []
  for (let i = 0; i < dids.length; i += BATCH_SIZE) {
    batches.push(dids.slice(i, i + BATCH_SIZE))
  }

  const batchQueries = useQueries({
    queries: batches.map(batch => ({
      queryKey: profilesQueryKey(batch),
      queryFn: async () => {
        const res = await agent.getProfiles({actors: batch})
        return res.data
      },
      staleTime: STALE.MINUTES.FIVE,
    })),
  })

  const profiles = batchQueries.flatMap(q => q.data?.profiles ?? [])

  const renderItem = ({
    item,
    index,
  }: {
    item: ActorDefs.ProfileViewDetailed
    index: number
  }) => {
    if (!moderationOpts) return null
    return (
      <View
        style={[a.py_md, a.px_xl, a.border_t, t.atoms.border_contrast_low]}
        key={item.did}>
        <ProfileCard.Link
          profile={item}
          testID={`hiddenRepostAccount-${index}`}>
          <ProfileCard.Outer>
            <ProfileCard.Header>
              <ProfileCard.Avatar
                profile={item}
                moderationOpts={moderationOpts}
              />
              <ProfileCard.NameAndHandle
                profile={item}
                moderationOpts={moderationOpts}
              />
              <Button
                label={_(msg`Show reposts`)}
                size="small"
                variant="solid"
                color="secondary"
                onPress={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  unhideRepostsFrom({did: item.did})
                }}>
                <ButtonText>
                  <Trans>Unhide</Trans>
                </ButtonText>
              </Button>
            </ProfileCard.Header>
          </ProfileCard.Outer>
        </ProfileCard.Link>
      </View>
    )
  }

  return (
    <Layout.Screen testID="hiddenRepostsFromScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Hidden Reposts</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      {dids.length === 0 ? (
        <Layout.Content>
          <Info />
          <Empty />
        </Layout.Content>
      ) : (
        <Layout.Center>
          <List
            data={profiles}
            keyExtractor={item => item.did}
            renderItem={renderItem}
            initialNumToRender={15}
            ListHeaderComponent={Info}
          />
        </Layout.Center>
      )}
    </Layout.Screen>
  )
}

function Empty() {
  const t = useTheme()
  return (
    <View style={[a.pt_2xl, a.px_xl, a.align_center]}>
      <View
        style={[
          a.py_md,
          a.px_lg,
          a.rounded_sm,
          t.atoms.bg_contrast_25,
          a.border,
          t.atoms.border_contrast_low,
          {maxWidth: 400},
        ]}>
        <Text style={[a.text_sm, a.text_center, t.atoms.text_contrast_high]}>
          <Trans>
            You haven't hidden reposts from any accounts yet. To hide reposts,
            go to a user's profile and select "Hide reposts" from their profile
            menu.
          </Trans>
        </Text>
      </View>
    </View>
  )
}

function Info({style}: {style?: StyleProp<ViewStyle>}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.w_full,
        t.atoms.bg_contrast_25,
        a.py_md,
        a.px_xl,
        a.border_t,
        {marginTop: a.border.borderWidth * -1},
        t.atoms.border_contrast_low,
        style,
      ]}>
      <Text style={[a.text_center, a.text_sm, t.atoms.text_contrast_high]}>
        <Trans>
          Reposts from these accounts are hidden in your Following feed. Their
          original posts will still appear.
        </Trans>
      </Text>
    </View>
  )
}
