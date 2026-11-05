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

type PublicationProps = ssTypes.PreviewProps &
  ssTypes.PublicApiProps & {
    onPress?: () => void
    onLongPress?: () => void
    view: app.bsky.embed.external.ViewArticlePublication
    /**
     * Applied to the outer frame.
     */
    style?: StyleProp<ViewStyle>
    /**
     * Insets the content without shrinking the primary link's hit area.
     * Use this, not `style`, to inset rows in a list.
     */
    containerStyle?: StyleProp<ViewStyle>
    /**
     * Focus plumbing for hosts such as carousels. The ref applies to the
     * primary link only; the subscribe link receives just `tabIndex` and
     * `onFocus`.
     */
    linkProps?: Pick<LinkProps, 'ref' | 'tabIndex' | 'onFocus'>
    hideSubscribe?: boolean
  }

/**
 * Fills its host column with no outer padding, border, or rounding of its own.
 */
export function Publication(props: PublicationProps) {
  return <PublicationBase {...props} card={false} />
}

/**
 * The framed presentation: bordered, rounded, filled, and inset.
 */
export function PublicationCard({containerStyle, ...props}: PublicationProps) {
  return (
    <PublicationBase
      {...props}
      card
      containerStyle={[a.p_md, containerStyle]}
    />
  )
}

function PublicationBase({
  card,
  preview,
  view,
  onPress,
  onLongPress,
  style,
  containerStyle,
  linkProps,
  onEmbedInteractionCallback,
  hideSubscribe,
}: PublicationProps & {card: boolean}) {
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
      testID={card ? 'publicationCard' : 'publication'}
      style={[
        a.relative,
        a.w_full,
        card && [
          a.rounded_lg,
          a.overflow_hidden,
          a.border,
          interacted
            ? t.atoms.border_contrast_high
            : t.atoms.border_contrast_low,
        ],
        interacted ? t.atoms.bg_contrast_25 : card && t.atoms.bg,
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
      <View style={containerStyle}>
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
    </View>
  )
}
