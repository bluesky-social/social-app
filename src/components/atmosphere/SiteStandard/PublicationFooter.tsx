import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {PublicationIcon} from '#/components/atmosphere/SiteStandard/PublicationIcon'
import {StandardSiteMetaRow} from '#/components/atmosphere/SiteStandard/StandardSiteMetaRow'
import {SubscribeButton} from '#/components/atmosphere/SiteStandard/SubscribeButton'
import type * as ssTypes from '#/components/atmosphere/SiteStandard/types'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'

export function PublicationFooter({
  preview,
  view,
  onPress,
  onLongPress,
  interactedOuter,
  onEmbedInteractionCallback,
}: ssTypes.PreviewProps &
  ssTypes.PublicApiProps & {
    view: app.bsky.embed.external.ViewArticlePublication
    onPress?: () => void
    onLongPress?: () => void
    interactedOuter?: boolean
  }) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {gtPhone} = useBreakpoints()
  const {
    state: interacted,
    onIn: onInteract,
    onOut: onInteractOut,
  } = useInteractionState()

  return (
    <View
      style={[
        a.flex_1,
        a.align_center,
        a.justify_between,
        a.p_md,
        a.gap_md,
        a.overflow_hidden,
        /*
         * Rounds the bottom corners to match the container border, since the
         * container itself can't clip (overflow_hidden there breaks the peek
         * lift animation on the article above).
         */
        {
          borderBottomLeftRadius: a.rounded_lg.borderRadius,
          borderBottomRightRadius: a.rounded_lg.borderRadius,
        },
        gtPhone && [a.flex_row, a.gap_sm],
        interactedOuter && t.atoms.bg_contrast_25,
        preview && a.pointer_events_none,
      ]}>
      <Link
        shouldProxy
        to={view.uri}
        label={view.title ? l`View ${view.title}` : l`View publication`}
        onPress={onPress}
        onLongPress={onLongPress}
        style={[a.absolute, a.inset_0, web({outline: 0})]}
        {...web({
          onMouseEnter: onInteract,
          onMouseLeave: onInteractOut,
        })}
        onFocus={onInteract}
        onBlur={onInteractOut}>
        <></>
      </Link>

      <View
        style={[
          a.w_full,
          a.flex_row,
          a.align_center,
          a.gap_sm,
          gtPhone && a.flex_1,
          a.pointer_events_none,
        ]}>
        <PublicationIcon view={view} size={32} interacted={interacted} />
        <View style={[a.flex_1, a.gap_2xs]}>
          <Text
            emoji
            numberOfLines={1}
            style={[
              a.text_sm,
              a.font_medium,
              a.leading_tight,
              t.atoms.text,
              interacted && a.underline,
            ]}>
            {view.title}
          </Text>
          <StandardSiteMetaRow
            preview={preview}
            type="publication"
            view={view}
          />
        </View>
      </View>

      <SubscribeButton
        preview={preview}
        view={view}
        style={[a.z_10, !gtPhone && [a.w_full, a.justify_center]]}
        onEmbedInteractionCallback={onEmbedInteractionCallback}
      />
    </View>
  )
}
