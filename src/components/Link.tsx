import {useCallback, useMemo} from 'react'
import {
  type GestureResponderEvent,
  Linking,
  type NativeSyntheticEvent,
  type TargetedEvent,
} from 'react-native'
import {sanitizeUrl} from '@braintree/sanitize-url'
import {useLingui} from '@lingui/react/macro'
import {
  type LinkProps as RNLinkProps,
  StackActions,
} from '@react-navigation/native'

import {BSKY_DOWNLOAD_URL} from '#/lib/constants'
import {useGroupChatJoinIntent} from '#/lib/hooks/useIntentHandler'
import {useNavigationDeduped} from '#/lib/hooks/useNavigationDeduped'
import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {type AllNavigatorParams, type RouteParams} from '#/lib/routes/types'
import {shareUrl} from '#/lib/sharing'
import {
  convertBskyAppUrlIfNeeded,
  createProxiedUrl,
  getChatInviteCodeFromUrl,
  isBskyDownloadUrl,
  isExternalUrl,
  linkRequiresWarning,
} from '#/lib/strings/url-helpers'
import {useModalControls} from '#/state/modals'
import {useInAppBrowser} from '#/state/preferences/in-app-browser'
import {atoms as a, flatten, type TextStyleProp, useTheme, web} from '#/alf'
import {Button, type ButtonProps} from '#/components/Button'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as ShareIcon} from '#/components/icons/ArrowOutOfBox'
import * as PeekMenu from '#/components/PeekMenu'
import {Text, type TextProps} from '#/components/Typography'
import {IS_IOS, IS_NATIVE, IS_WEB} from '#/env'
import {router} from '#/routes'
import {useGlobalDialogsControlContext} from './dialogs/Context'

/**
 * Only available within a `Link`, since that inherits from `Button`.
 * `InlineLink` provides no context.
 */
export {useButtonContext as useLinkContext} from '#/components/Button'

type BaseLinkProps = {
  testID?: string

  to: RNLinkProps<AllNavigatorParams> | string

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

  /**
   * iOS only. Wraps the link in a peek menu: long-pressing previews the live
   * page in an in-app browser (morphing into it on tap when the in-app browser
   * preference is on), with a share action in the menu. No-op elsewhere.
   */
  peek?: boolean

  /**
   * Web only
   */
  onMouseEnter?: () => void
  /**
   * Web only
   */
  onMouseLeave?: () => void
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
  const href = useMemo(() => {
    return typeof to === 'string'
      ? convertBskyAppUrlIfNeeded(sanitizeUrl(to))
      : to.screen
        ? router.matchName(to.screen)?.build(to.params)
        : to.href
          ? convertBskyAppUrlIfNeeded(sanitizeUrl(to.href))
          : undefined
  }, [to])

  if (!href) {
    throw new Error(
      'Could not resolve screen. Link `to` prop must be a string or an object with `screen` and `params` properties',
    )
  }

  const isExternal = isExternalUrl(href)
  const {closeModal} = useModalControls()
  const {linkWarningDialogControl} = useGlobalDialogsControlContext()
  const openLink = useOpenLink()
  const groupChatJoinIntent = useGroupChatJoinIntent()

  const onPress = useCallback(
    (e: GestureResponderEvent) => {
      const exitEarlyIfFalse = outerOnPress?.(e)

      if (exitEarlyIfFalse === false) return

      const requiresWarning = Boolean(
        !disableMismatchWarning &&
        displayText &&
        isExternal &&
        linkRequiresWarning(href, displayText),
      )

      if (IS_WEB) {
        e.preventDefault()
      }

      const chatInviteCode = getChatInviteCodeFromUrl(href)
      if (chatInviteCode) {
        groupChatJoinIntent(chatInviteCode, href)
        return
      }

      if (requiresWarning) {
        linkWarningDialogControl.open({
          displayText,
          href,
        })
      } else {
        if (isExternal) {
          void openLink(href, overridePresentation, shouldProxy)
        } else {
          const shouldOpenInNewTab = shouldClickOpenNewTab(e)

          if (isBskyDownloadUrl(href)) {
            void shareUrl(BSKY_DOWNLOAD_URL)
          } else if (
            shouldOpenInNewTab ||
            href.startsWith('http') ||
            href.startsWith('mailto')
          ) {
            void openLink(href)
          } else {
            closeModal() // close any active modals

            const [screen, params] = router.matchPath(href) as [
              screen: keyof AllNavigatorParams,
              params?: RouteParams,
            ]

            // does not apply to web's flat navigator
            if (IS_NATIVE && screen !== 'NotFound') {
              const state = navigation.getState()
              // if screen is not in the current navigator, it means it's
              // most likely a tab screen. note: state can be undefined
              if (!state?.routeNames?.includes?.(screen)) {
                const parent = navigation.getParent()
                if (
                  parent &&
                  parent.getState().routeNames.includes(`${screen}Tab`)
                ) {
                  // yep, it's a tab screen. i.e. SearchTab
                  // thus we need to navigate to the child screen
                  // via the parent navigator
                  // see https://reactnavigation.org/docs/upgrading-from-6.x/#changes-to-the-navigate-action
                  // TODO: can we support the other kinds of actions? push/replace -sfn

                  // @ts-expect-error include does not narrow the type unfortunately
                  parent.navigate(`${screen}Tab`, {screen, params})
                  return
                } else {
                  // will probably fail, but let's try anyway
                }
              }
            }

            if (action === 'push') {
              navigation.dispatch(StackActions.push(screen, params))
            } else if (action === 'replace') {
              navigation.dispatch(StackActions.replace(screen, params))
            } else if (action === 'navigate') {
              // @ts-expect-error not typed
              navigation.navigate(screen, params, {pop: true})
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
      openLink,
      closeModal,
      action,
      navigation,
      overridePresentation,
      shouldProxy,
      linkWarningDialogControl,
      groupChatJoinIntent,
    ],
  )

  const handleLongPress = useCallback(() => {
    const requiresWarning = Boolean(
      !disableMismatchWarning &&
      displayText &&
      isExternal &&
      linkRequiresWarning(href, displayText),
    )

    if (requiresWarning) {
      linkWarningDialogControl.open({
        displayText,
        href,
        share: true,
      })
    } else {
      void shareUrl(href)
    }
  }, [
    disableMismatchWarning,
    displayText,
    href,
    isExternal,
    linkWarningDialogControl,
  ])

  const onLongPress = useCallback(
    (e: GestureResponderEvent) => {
      const exitEarlyIfFalse = outerOnLongPress?.(e)
      if (exitEarlyIfFalse === false) return
      return IS_NATIVE && shareOnLongPress ? handleLongPress() : undefined
    },
    [outerOnLongPress, handleLongPress, shareOnLongPress],
  )

  // Opens the link through the normal external flow (consent dialog, in-app
  // browser, or system browser per preference). Used by the peek menu when the
  // in-app browser is off, so committing the peek behaves like a plain tap.
  const openExternally = useCallback(() => {
    void openLink(href, overridePresentation, shouldProxy)
  }, [openLink, href, overridePresentation, shouldProxy])

  return {
    isExternal,
    href,
    onPress,
    onLongPress,
    openExternally,
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
  peek,
  ...rest
}: LinkProps) {
  const {href, isExternal, onPress, onLongPress, openExternally} = useLink({
    to,
    displayText: typeof children === 'string' ? children : '',
    action,
    onPress: outerOnPress,
    onLongPress: outerOnLongPress,
    shouldProxy: shouldProxy,
    overridePresentation,
  })

  // Peek is iOS-only and only makes sense for external web links.
  const peekEnabled = Boolean(peek && IS_IOS && isExternal)

  const button = (
    <Button
      {...rest}
      style={[a.justify_start, rest.style]}
      role="link"
      accessibilityRole="link"
      href={href}
      onPress={download ? undefined : onPress}
      // When peeking, the native long-press drives the context menu. A
      // simultaneous RN long-press recognizer fights it — cancelling the tap
      // and breaking the lift animation — so leave long-press to native and
      // surface sharing through the peek menu instead.
      onLongPress={peekEnabled ? undefined : onLongPress}
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

  if (peekEnabled) {
    // Match the lift radius to whatever the consumer styled the link with, so
    // the peek animation clips to the same corners as the rendered card.
    const borderRadius = flatten(rest.style)?.borderRadius
    return (
      <LinkPeek
        href={href}
        onCommit={openExternally}
        shouldProxy={shouldProxy}
        borderRadius={typeof borderRadius === 'number' ? borderRadius : 0}>
        {button}
      </LinkPeek>
    )
  }

  return button
}

/**
 * iOS peek-menu wrapper for an external `Link`. Long-pressing previews the live
 * page in an in-app browser; the in-app-browser preference decides whether
 * tapping the peek morphs into the browser or hands off to the normal link flow
 * via `onCommit`. The menu carries a Share action.
 */
function LinkPeek({
  href,
  onCommit,
  shouldProxy,
  borderRadius,
  children,
}: {
  href: string
  onCommit: () => void
  shouldProxy?: boolean
  borderRadius: number
  children: React.ReactNode
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const useInAppBrowserPref = useInAppBrowser()

  return (
    <PeekMenu.Root>
      <PeekMenu.Trigger
        preview={{
          type: 'link',
          url: shouldProxy ? createProxiedUrl(href) : href,
          // Only morph natively when the user has explicitly opted in. When the
          // preference is unset (undefined), defer to the JS flow so the consent
          // dialog can show.
          useInAppBrowser: useInAppBrowserPref === true,
          browserToolbarColor: t.atoms.bg.backgroundColor,
          browserControlsColor: t.palette.primary_500,
        }}
        borderRadius={borderRadius}
        // Fires only when not morphing natively (in-app browser off/unset).
        onPreviewPress={onCommit}>
        {children}
      </PeekMenu.Trigger>
      <PeekMenu.Menu>
        <PeekMenu.MenuItem id="share" onSelect={() => shareUrl(href)}>
          <PeekMenu.MenuItemIcon icon={ShareIcon} />
          <PeekMenu.MenuItemText>{l`Share`}</PeekMenu.MenuItemText>
        </PeekMenu.MenuItem>
      </PeekMenu.Menu>
    </PeekMenu.Root>
  )
}

export type InlineLinkProps = React.PropsWithChildren<
  BaseLinkProps &
    TextStyleProp &
    Pick<TextProps, 'selectable' | 'numberOfLines' | 'emoji'> &
    Pick<ButtonProps, 'label' | 'accessibilityHint' | 'onFocus' | 'onBlur'> & {
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
    state: interacted,
    onIn: onInteract,
    onOut: onInteractOut,
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
        interacted &&
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
      {...web({
        onMouseEnter: () => {
          rest.onMouseEnter?.()
          onInteract()
        },
        onMouseLeave: () => {
          rest.onMouseLeave?.()
          onInteractOut()
        },
      })}
      onFocus={(e: NativeSyntheticEvent<TargetedEvent>) => {
        rest.onFocus?.(e)
        onInteract()
      }}
      onBlur={(e: NativeSyntheticEvent<TargetedEvent>) => {
        rest.onBlur?.(e)
        onInteractOut()
      }}
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

/**
 * A barebones version of `InlineLinkText`, for use outside a
 * `react-navigation` context.
 */
export function SimpleInlineLinkText({
  children,
  to,
  style,
  download,
  selectable,
  label,
  disableUnderline,
  shouldProxy,
  onPress: outerOnPress,
  ...rest
}: Omit<
  InlineLinkProps,
  | 'to'
  | 'action'
  | 'disableMismatchWarning'
  | 'overridePresentation'
  | 'onLongPress'
  | 'shareOnLongPress'
> & {
  to: string
}) {
  const t = useTheme()
  const {
    state: interacted,
    onIn: onInteract,
    onOut: onInteractOut,
  } = useInteractionState()
  const flattenedStyle = flatten(style) || {}
  const isExternal = isExternalUrl(to)

  let href = to
  if (shouldProxy) {
    href = createProxiedUrl(href)
  }

  const onPress = (e: GestureResponderEvent) => {
    const exitEarlyIfFalse = outerOnPress?.(e)
    if (exitEarlyIfFalse === false) return
    void Linking.openURL(href)
  }

  return (
    <Text
      selectable={selectable}
      accessibilityHint=""
      accessibilityLabel={label}
      {...rest}
      style={[
        {color: t.palette.primary_500},
        interacted &&
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
      onPress={onPress}
      {...web({
        onMouseEnter: () => {
          rest.onMouseEnter?.()
          onInteract()
        },
        onMouseLeave: () => {
          rest.onMouseLeave?.()
          onInteractOut()
        },
      })}
      onFocus={(e: NativeSyntheticEvent<TargetedEvent>) => {
        rest.onFocus?.(e)
        onInteract()
      }}
      onBlur={(e: NativeSyntheticEvent<TargetedEvent>) => {
        rest.onBlur?.(e)
        onInteractOut()
      }}
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
  return IS_WEB ? (
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
  to: string
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
      if (!IS_WEB || !isModifiedClickEvent(e)) {
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
  if (!IS_WEB) return false
  const event = e as unknown as MouseEvent
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey
}

/**
 * Determines if the web click target is anything other than `_self`
 */
export function isClickTargetExternal(e: GestureResponderEvent) {
  if (!IS_WEB) return false
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
  if (!IS_WEB) return false
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
  if (!IS_WEB) return false
  const event = e as unknown as MouseEvent
  const isMiddleClick = IS_WEB && event.button === 1
  return isClickEventWithMetaKey(e) || isClickTargetExternal(e) || isMiddleClick
}
