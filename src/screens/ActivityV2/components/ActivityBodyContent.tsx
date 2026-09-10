import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {
  PublicationCard,
  StandardSiteEmbed,
} from '#/components/Post/Embed/StandardSiteEmbed'
import type * as ssTypes from '#/components/Post/Embed/StandardSiteEmbed/types'
import {type app} from '#/lexicons'
import {type ActivityPresentationProps} from '../presentation'

export function ActivityArticleEmbedsBody({
  computedItemView,
}: ActivityPresentationProps) {
  if (computedItemView.body?.kind !== 'article-embeds') {
    return null
  }

  return (
    <View style={[a.gap_sm]}>
      {computedItemView.body.views.map(view => (
        <StandardSiteEmbed key={getViewKey(view)} view={view} />
      ))}
    </View>
  )
}

export function ActivityPublicationCardBody({
  computedItemView,
}: ActivityPresentationProps) {
  const t = useTheme()

  if (computedItemView.body?.kind !== 'publication-card') {
    return null
  }

  const themeColors: ssTypes.ThemeColors = computedItemView.body
    .themeColors ?? {
    custom: false,
    accent: t.atoms.text?.color ?? '#000000',
    accentForeground: t.atoms.text_inverted?.color ?? '#ffffff',
  }

  return (
    <PublicationCard
      view={computedItemView.body.view}
      themeColors={themeColors}
    />
  )
}

function getViewKey(view: app.bsky.embed.external.ViewExternal) {
  return view.associatedRefs?.[0]?.uri ?? view.uri
}
