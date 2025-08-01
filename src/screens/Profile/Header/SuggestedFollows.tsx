import {View} from 'react-native'

import {useSuggestedFollowsByActorQuery} from '#/state/queries/suggested-follows'
import {atoms as a, useTheme, type ViewStyleProp} from '#/alf'
import {ProfileGrid} from '#/components/FeedInterstitials'
import * as Skellie from '#/components/Skeleton'

const CARD_HEIGHT = 200
const MOBILE_CARD_WIDTH = 150

function CardOuter({
  children,
  style,
}: {children: React.ReactNode | React.ReactNode[]} & ViewStyleProp) {
  const t = useTheme()
  return (
    <View
      style={[
        a.p_md,
        a.align_center,
        a.justify_between,
        a.rounded_lg,
        a.curve_continuous,
        a.border,
        t.atoms.bg,
        t.atoms.border_contrast_low,
        {height: CARD_HEIGHT, width: MOBILE_CARD_WIDTH},
        style,
      ]}>
      {children}
    </View>
  )
}

export function SuggestedFollowPlaceholder() {
  return (
    <CardOuter>
      <Skellie.Circle size={64} />
      <View
        style={[
          a.w_full,
          a.flex_col,
          a.align_center,
          a.flex_1,
          a.pt_md,
          a.pb_sm,
        ]}>
        <Skellie.Text style={[a.text_sm, {width: '60%'}]} />
        <Skellie.Text style={[a.text_sm, {width: '90%'}]} />
        <Skellie.Text style={[a.text_sm, {width: '80%'}]} />
      </View>
      <Skellie.Pill size={33} style={[a.rounded_sm, a.w_full, a.flex_grow_0]} />
    </CardOuter>
  )
}

export function ProfileHeaderSuggestedFollows({actorDid}: {actorDid: string}) {
  const {isLoading, data, error} = useSuggestedFollowsByActorQuery({
    did: actorDid,
  })

  return (
    <ProfileGrid
      isSuggestionsLoading={isLoading}
      profiles={data?.suggestions ?? []}
      recId={data?.recId}
      error={error}
      viewContext="profileHeader"
    />
  )
}
