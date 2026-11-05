import {type StyleProp, View, type ViewStyle} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {PublicationIcon} from '#/components/atmosphere/SiteStandard/PublicationIcon'
import {StandardSiteMetaRow} from '#/components/atmosphere/SiteStandard/StandardSiteMetaRow'
import {SubscribeButton} from '#/components/atmosphere/SiteStandard/SubscribeButton'
import type * as ssTypes from '#/components/atmosphere/SiteStandard/types'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Link, type LinkProps} from '#/components/Link'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'

export function Publication({
  preview,
  view,
  onPress,
  onLongPress,
  style,
  linkProps,
  onEmbedInteractionCallback,
  hideSubscribe,
}: ssTypes.PreviewProps &
  ssTypes.PublicApiProps & {
    onPress?: () => void
    onLongPress?: () => void
    view: app.bsky.embed.external.ViewArticlePublication
    style?: StyleProp<ViewStyle>
    /**
     * Focus plumbing for hosts such as carousels. The ref applies to the
     * primary link only; the subscribe link receives just `tabIndex` and
     * `onFocus`.
     */
    linkProps?: Pick<LinkProps, 'ref' | 'tabIndex' | 'onFocus'>
    hideSubscribe?: boolean
  }) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {gtPhone} = useBreakpoints()
  const {
    state: interacted,
    onIn: onInteract,
    onOut: onInteractOut,
  } = useInteractionState()

  /* The primary link alone takes the ref; it is the host's focus target. */
  const subscribeLinkProps = linkProps && {
    tabIndex: linkProps.tabIndex,
    onFocus: linkProps.onFocus,
  }

  return (
    <View
      style={[
        a.rounded_lg,
        a.overflow_hidden,
        a.w_full,
        a.border,
        a.p_md,
        interacted
          ? [t.atoms.bg_contrast_25, t.atoms.border_contrast_high]
          : [t.atoms.bg, t.atoms.border_contrast_low],
        style,
      ]}>
      <Link
        shouldProxy
        to={view.uri}
        label={view.title ? l`View ${view.title}` : l`View publication`}
        onPress={onPress}
        onLongPress={onLongPress}
        {...web({
          onMouseEnter: onInteract,
          onMouseLeave: onInteractOut,
        })}
        ref={linkProps?.ref}
        tabIndex={linkProps?.tabIndex}
        onFocus={e => {
          onInteract()
          linkProps?.onFocus?.(e)
        }}
        onBlur={onInteractOut}
        style={[a.absolute, a.inset_0]}>
        <></>
      </Link>

      <View
        style={[
          a.align_center,
          a.justify_between,
          a.gap_md,
          a.pointer_events_none,
          gtPhone && [a.flex_row, a.gap_sm],
        ]}>
        <View
          style={[
            a.w_full,
            a.flex_row,
            a.align_center,
            a.gap_sm,
            gtPhone && a.flex_1,
          ]}>
          <PublicationIcon view={view} size={40} interacted={interacted} />
          <View style={[a.flex_1, a.gap_2xs]}>
            <Text
              emoji
              numberOfLines={1}
              style={[
                a.text_md,
                a.font_semi_bold,
                t.atoms.text,
                a.leading_snug,
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

        {gtPhone && !hideSubscribe && (
          <SubscribeButton
            preview={preview}
            view={view}
            style={[!gtPhone && [a.w_full, a.justify_center]]}
            linkProps={subscribeLinkProps}
            onEmbedInteractionCallback={onEmbedInteractionCallback}
          />
        )}
      </View>

      <View style={[a.flex_1, a.pointer_events_none]}>
        {!!view.description && (
          <View style={[a.pt_sm]}>
            <Text emoji style={[a.text_sm, a.leading_snug]} numberOfLines={3}>
              {view.description}
            </Text>
          </View>
        )}

        {!gtPhone && (
          <View style={[a.pt_sm]}>
            <SubscribeButton
              preview={preview}
              view={view}
              style={[!gtPhone && [a.w_full, a.justify_center]]}
              linkProps={subscribeLinkProps}
              onEmbedInteractionCallback={onEmbedInteractionCallback}
            />
          </View>
        )}
      </View>
    </View>
  )
}
