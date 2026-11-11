import {atoms as a, useTheme} from '#/alf'
import {PublicationCard} from '#/components/Post/Embed/StandardSiteEmbed'
import type * as ssTypes from '#/components/Post/Embed/StandardSiteEmbed/types'
import {
  getPublicationBodyThemeColors,
  getPublicationExternalView,
} from '../externalViews'
import {type ActivityPresentationProps} from '../presentation'
import {getActivityContent} from '../relationships'
import {ActivityCounts} from './ActivityCounts'
import {ActivityRowBody} from './ActivityHeader'

export function ActivityPublicationCardBody({item}: ActivityPresentationProps) {
  const t = useTheme()

  const content = getActivityContent(item)
  if (!content) return null
  const view = getPublicationExternalView(content)
  if (!view) return null

  const themeColors: ssTypes.ThemeColors = getPublicationBodyThemeColors(
    view,
  ) ?? {
    custom: false,
    accent: t.atoms.text?.color ?? '#000000',
    accentForeground: t.atoms.text_inverted?.color ?? '#ffffff',
  }

  return (
    <ActivityRowBody>
      <PublicationCard view={view} themeColors={themeColors}>
        <ActivityCounts view={content.view} style={a.pt_sm} />
      </PublicationCard>
    </ActivityRowBody>
  )
}
