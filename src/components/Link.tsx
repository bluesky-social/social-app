import React from 'react'
import {type GestureResponderEvent} from 'react-native'
import {sanitizeUrl} from '@braintree/sanitize-url'
import {StackActions, useLinkProps} from '@react-navigation/native'

import {BSKY_DOWNLOAD_URL} from '#/lib/constants'
import {useNavigationDeduped} from '#/lib/hooks/useNavigationDeduped'
import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {type AllNavigatorParams} from '#/lib/routes/types'
import {shareUrl} from '#/lib/sharing'
import {
  convertBskyAppUrlIfNeeded,
  isBskyDownloadUrl,
  isExternalUrl,
  linkRequiresWarning,
} from '#/lib/strings/url-helpers'
import {isNative, isWeb} from '#/platform/detection'
import {useModalControls} from '#/state/modals'
import {atoms as a, flatten, type TextStyleProp, useTheme, web} from '#/alf'
import {Button, type ButtonProps} from '#/components/Button'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Text, type TextProps} from '#/components/Typography'
import {router} from '#/routes'

/**
 * Only available within a `Link`, since that inherits from `Button`.
 * `InlineLink` provides no context.
 */
export {useButtonContext as useLinkContext} from '#/components/Button'

type BaseLinkProps = Pick<
  Parameters<typeof useLinkProps<AllNavigatorParams>>[0],
  'to'
> & {
  testID?: string

  /**
   * The React Navigation `StackAction` to perform when the link is pressed.
   */
  action?: 'push' | 'replace' | 'navigate'

  /**
   * If true, will warn the user if the link text does not match the href.
   *
   * Note: atm this only works for `InlineLink`s with a string child.
   */
  disableMismatchWarning?: boolean

  /**
   * Callback for when the link is pressed. Prevent default and return `false`
   * to exit early and prevent navigation.
   *
   * DO NOT use this for navigation, that's what the `to` prop is for.
   */
  onPress?: (e: GestureResponderEvent) => void | false

  /**
   * Callback for when the link is long pressed (on native). Prevent default
   * and return `false` to exit early and prevent default long press hander.
   */
  onLongPress?: (e: GestureResponderEvent) => void | false

  /**
   * Web-only attribute. Sets `download` attr on web.
   */
  download?: string

  /**
   * Native-only attribute. If true, will open the share sheet on long press.
   */
  shareOnLongPress?: boolean

  /**
   * Whether the link should be opened through the redirect proxy.
   */
  shouldProxy?: boolean
}

export function useLink({
  to,
  displayText,
  action = 'push',
  disableMismatchWarning,
  onPress: outerOnPress,
  onLongPress: outerOnLongPress,
  shareOnLongPress,
  overridePresentation,
  shouldProxy,
}: BaseLinkProps & {
  displayText: string
  overridePresentation?: boolean
  shouldProxy?: boolean
}) {
  const navigation = useNavigationDeduped()
  const {href} = useLinkProps<AllNavigatorParams>({
    to:
      typeof to === 'string' ? convertBskyAppUrlIfNeeded(sanitizeUrl(to)) : to,
  })
  const isExternal = isExternalUrl(href)
  const {openModal, closeModal} = useModalControls()
  const openLink = useOpenLink()

  const onPress = React.useCallback(
    (e: GestureResponderEvent) => {
      const exitEarlyIfFalse = outerOnPress?.(e)

      if (exitEarlyIfFalse === false) return

      const requiresWarning = Boolean(
        !disableMismatchWarning &&
          displayText &&
          isExternal &&
          linkRequiresWarning(href, displayText),
      )

      if (isWeb) {
        e.preventDefault()
      }

      if (requiresWarning) {
        openModal({
          name: 'link-warning',
          text: displayText,
          href: href,
        })
      } else {
        if (isExternal) {
          openLink(href, overridePresentation, shouldProxy)
        } else {
          const shouldOpenInNewTab = shouldClickOpenNewTab(e)

          if (isBskyDownloadUrl(href)) {
            shareUrl(BSKY_DOWNLOAD_URL)
          } else if (
            shouldOpenInNewTab ||
            href.startsWith('http') ||
            href.startsWith('mailto')
          ) {
            openLink(href)
          } else {
            closeModal() // close any active modals

            if (action === 'push') {
              navigation.dispatch(StackActions.push(...router.matchPath(href)))
            } else if (action === 'replace') {
              navigation.dispatch(
                StackActions.replace(...router.matchPath(href)),
              )
            } else if (action === 'navigate') {
              // @ts-ignore
              navigation.navigate(...router.matchPath(href))
            } else {
              throw Error('Unsupported navigator action.')
            }
          }
        }
      }
    },
    [
      outerOnPress,
      disableMismatchWarning,
      displayText,
      isExternal,
      href,
      openModal,
      openLink,
      closeModal,
      action,
      navigation,
      overridePresentation,
      shouldProxy,
    ],
  )

  const handleLongPress = React.useCallback(() => {
    const requiresWarning = Boolean(
      !disableMismatchWarning &&
        displayText &&
        isExternal &&
        linkRequiresWarning(href, displayText),
    )

    if (requiresWarning) {
      openModal({
        name: 'link-warning',
        text: displayText,
        href: href,
        share: true,
      })
    } else {
      shareUrl(href)
    }
  }, [disableMismatchWarning, displayText, href, isExternal, openModal])

  const onLongPress = React.useCallback(
    (e: GestureResponderEvent) => {
      const exitEarlyIfFalse = outerOnLongPress?.(e)
      if (exitEarlyIfFalse === false) return
      return isNative && shareOnLongPress ? handleLongPress() : undefined
    },
    [outerOnLongPress, handleLongPress, shareOnLongPress],
  )

  return {
    isExternal,
    href,
    onPress,
    onLongPress,
  }
}

export type LinkProps = Omit<BaseLinkProps, 'disableMismatchWarning'> &
  Omit<ButtonProps, 'onPress' | 'disabled'> & {
    overridePresentation?: boolean
  }

/**
 * A interactive element that renders as a `<a>` tag on the web. On mobile it
 * will translate the `href` to navigator screens and params and dispatch a
 * navigation action.
 *
 * Intended to behave as a web anchor tag. For more complex routing, use a
 * `Button`.
 */
export function Link({
  children,
  to,
  action = 'push',
  onPress: outerOnPress,
  onLongPress: outerOnLongPress,
  download,
  shouldProxy,
  overridePresentation,
  ...rest
}: LinkProps) {
  const {href, isExternal, onPress, onLongPress} = useLink({
    to,
    displayText: typeof children === 'string' ? children : '',
    action,
    onPress: outerOnPress,
    onLongPress: outerOnLongPress,
    shouldProxy: shouldProxy,
    overridePresentation,
  })

  return (
    <Button
      {...rest}
      style={[a.justify_start, flatten(rest.style)]}
      role="link"
      accessibilityRole="link"
      href={href}
      onPress={download ? undefined : onPress}
      onLongPress={onLongPress}
      {...web({
        hrefAttrs: {
          target: download ? undefined : isExternal ? 'blank' : undefined,
          rel: isExternal ? 'noopener noreferrer' : undefined,
          download,
        },
        dataSet: {
          // no underline, only `InlineLink` has underlines
          noUnderline: '1',
        },
      })}>
      {children}
    </Button>
  )
}

export type InlineLinkProps = React.PropsWithChildren<
  BaseLinkProps &
    TextStyleProp &
    Pick<TextProps, 'selectable' | 'numberOfLines' | 'emoji'> &
    Pick<ButtonProps, 'label' | 'accessibilityHint'> & {
      disableUnderline?: boolean
      title?: TextProps['title']
      overridePresentation?: boolean
    }
>

export function InlineLinkText({
  children,
  to,
  action = 'push',
  disableMismatchWarning,
  style,
  onPress: outerOnPress,
  onLongPress: outerOnLongPress,
  download,
  selectable,
  label,
  shareOnLongPress,
  disableUnderline,
  overridePresentation,
  shouldProxy,
  ...rest
}: InlineLinkProps) {
  const t = useTheme()
  const stringChildren = typeof children === 'string'
  const {href, isExternal, onPress, onLongPress} = useLink({
    to,
    displayText: stringChildren ? children : '',
    action,
    disableMismatchWarning,
    onPress: outerOnPress,
    onLongPress: outerOnLongPress,
    shareOnLongPress,
    overridePresentation,
    shouldProxy: shouldProxy,
  })
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()
  const flattenedStyle = flatten(style) || {}

  return (
    <Text
      selectable={selectable}
      accessibilityHint=""
      accessibilityLabel={label}
      {...rest}
      style={[
        {color: t.palette.primary_500},
        hovered &&
          !disableUnderline && {
            ...web({
              outline: 0,
              textDecorationLine: 'underline',
              textDecorationColor:
                flattenedStyle.color ?? t.palette.primary_500,
            }),
          },
        flattenedStyle,
      ]}
      role="link"
      onPress={download ? undefined : onPress}
      onLongPress={onLongPress}
      onMouseEnter={onHoverIn}
      onMouseLeave={onHoverOut}
      accessibilityRole="link"
      href={href}
      {...web({
        hrefAttrs: {
          target: download ? undefined : isExternal ? 'blank' : undefined,
          rel: isExternal ? 'noopener noreferrer' : undefined,
          download,
        },
        dataSet: {
          // default to no underline, apply this ourselves
          noUnderline: '1',
        },
      })}>
      {children}
    </Text>
  )
}

export function WebOnlyInlineLinkText({
  children,
  to,
  onPress,
  ...props
}: Omit<InlineLinkProps, 'onLongPress'>) {
  return isWeb ? (
    <InlineLinkText {...props} to={to} onPress={onPress}>
      {children}
    </InlineLinkText>
  ) : (
    <Text {...props}>{children}</Text>
  )
}

/**
 * Utility to create a static `onPress` handler for a `Link` that would otherwise link to a URI
 *
 * Example:
 *   `<Link {...createStaticClick(e => {...})} />`
 */
export function createStaticClick(
  onPressHandler: Exclude<BaseLinkProps['onPress'], undefined>,
): {
  to: BaseLinkProps['to']
  onPress: Exclude<BaseLinkProps['onPress'], undefined>
} {
  return {
    to: '#',
    onPress(e: GestureResponderEvent) {
      e.preventDefault()
      onPressHandler(e)
      return false
    },
  }
}

/**
 * Utility to create a static `onPress` handler for a `Link`, but only if the
 * click was not modified in some way e.g. `Cmd` or a middle click.
 *
 * On native, this behaves the same as `createStaticClick` because there are no
 * options to "modify" the click in this sense.
 *
 * Example:
 *   `<Link {...createStaticClick(e => {...})} />`
 */
export function createStaticClickIfUnmodified(
  onPressHandler: Exclude<BaseLinkProps['onPress'], undefined>,
): {onPress: Exclude<BaseLinkProps['onPress'], undefined>} {
  return {
    onPress(e: GestureResponderEvent) {
      if (!isWeb || !isModifiedClickEvent(e)) {
        e.preventDefault()
        onPressHandler(e)
        return false
      }
    },
  }
}

/**
 * Determines if the click event has a meta key pressed, indicating the user
 * intends to deviate from default behavior.
 */
export function isClickEventWithMetaKey(e: GestureResponderEvent) {
  if (!isWeb) return false
  const event = e as unknown as MouseEvent
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey
}

/**
 * Determines if the web click target is anything other than `_self`
 */
export function isClickTargetExternal(e: GestureResponderEvent) {
  if (!isWeb) return false
  const event = e as unknown as MouseEvent
  const el = event.currentTarget as HTMLAnchorElement
  return el && el.target && el.target !== '_self'
}

/**
 * Determines if a click event has been modified in some way from its default
 * behavior, e.g. `Cmd` or a middle click.
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button}
 */
export function isModifiedClickEvent(e: GestureResponderEvent): boolean {
  if (!isWeb) return false
  const event = e as unknown as MouseEvent
  const isPrimaryButton = event.button === 0
  return (
    isClickEventWithMetaKey(e) || isClickTargetExternal(e) || !isPrimaryButton
  )
}

/**
 * Determines if a click event has been modified in a way that should indiciate
 * that the user intends to open a new tab.
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button}
 */
export function shouldClickOpenNewTab(e: GestureResponderEvent) {
  if (!isWeb) return false
  const event = e as unknown as MouseEvent
  const isMiddleClick = isWeb && event.button === 1
  return isClickEventWithMetaKey(e) || isClickTargetExternal(e) || isMiddleClick
}
