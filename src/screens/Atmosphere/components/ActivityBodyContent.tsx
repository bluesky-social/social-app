import {useTheme} from '#/alf'
import {PublicationCard} from '#/components/Post/Embed/StandardSiteEmbed'
import type * as ssTypes from '#/components/Post/Embed/StandardSiteEmbed/types'
import {
  getPublicationBodyThemeColors,
  getPublicationExternalView,
} from '../externalViews'
import {type ActivityPresentationProps} from '../presentation'
import {ActivityRowBody} from './ActivityHeader'

export function ActivityPublicationCardBody({item}: ActivityPresentationProps) {
  const t = useTheme()

  const activities =
    item.type === 'activity' ? [item.activity] : item.group.items
  for (const activity of activities) {
    const view = getPublicationExternalView(activity)
    if (!view) continue

    const themeColors: ssTypes.ThemeColors = getPublicationBodyThemeColors(
      view,
    ) ?? {
      custom: false,
      accent: t.atoms.text?.color ?? '#000000',
      accentForeground: t.atoms.text_inverted?.color ?? '#ffffff',
    }

    return (
      <ActivityRowBody>
        <PublicationCard view={view} themeColors={themeColors} />
      </ActivityRowBody>
    )
  }

  return null
}
