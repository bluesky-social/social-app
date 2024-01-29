import React from 'react'
import {
  GestureResponderEvent,
  Linking,
  TouchableWithoutFeedback,
} from 'react-native'
import {
  useLinkProps,
  useNavigation,
  StackActions,
} from '@react-navigation/native'
import {sanitizeUrl} from '@braintree/sanitize-url'

import {useInteractionState} from '#/components/hooks/useInteractionState'
import {isWeb} from '#/platform/detection'
import {useTheme, web, flatten, TextStyleProp} from '#/alf'
import {Button, ButtonProps} from '#/components/Button'
import {AllNavigatorParams, NavigationProp} from '#/lib/routes/types'
import {
  convertBskyAppUrlIfNeeded,
  isExternalUrl,
  linkRequiresWarning,
} from '#/lib/strings/url-helpers'
import {useModalControls} from '#/state/modals'
import {router} from '#/routes'
import {Text} from '#/components/Typography'

/**
 * Only available within a `Link`, since that inherits from `Button`.
 * `InlineLink` provides no context.
 */
export {useButtonContext as useLinkContext} from '#/components/Button'

type BaseLinkProps = Pick<
  Parameters<typeof useLinkProps<AllNavigatorParams>>[0],
  'to'
> & {
  /**
   * The React Navigation `StackAction` to perform when the link is pressed.
   */
  action?: 'push' | 'replace' | 'navigate'

  /**
   * If true, will warn the user if the link text does not match the href.
   *
   * Note: atm this only works for `InlineLink`s with a string child.
   */
  warnOnMismatchingTextChild?: boolean
}

export function useLink({
  to,
  displayText,
  action = 'push',
  warnOnMismatchingTextChild,
}: BaseLinkProps & {
  displayText: string
}) {
  const navigation = useNavigation<NavigationProp>()
  const {href} = useLinkProps<AllNavigatorParams>({
    to:
      typeof to === 'string' ? convertBskyAppUrlIfNeeded(sanitizeUrl(to)) : to,
  })
  const isExternal = isExternalUrl(href)
  const {openModal, closeModal} = useModalControls()

  const onPress = React.useCallback(
    (e: GestureResponderEvent) => {
      const requiresWarning = Boolean(
        warnOnMismatchingTextChild &&
          displayText &&
          isExternal &&
          linkRequiresWarning(href, displayText),
      )

      if (requiresWarning) {
        e.preventDefault()

        openModal({
          name: 'link-warning',
          text: displayText,
          href: href,
        })
      } else {
        e.preventDefault()

        if (isExternal) {
          Linking.openURL(href)
        } else {
          /**
           * A `GestureResponderEvent`, but cast to `any` to avoid using a bunch
           * of @ts-ignore below.
           */
          const event = e as any
          const isMiddleClick = isWeb && event.button === 1
          const isMetaKey =
            isWeb &&
            (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
          const shouldOpenInNewTab = isMetaKey || isMiddleClick

          if (
            shouldOpenInNewTab ||
            href.startsWith('http') ||
            href.startsWith('mailto')
          ) {
            Linking.openURL(href)
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
      href,
      isExternal,
      warnOnMismatchingTextChild,
      navigation,
      action,
      displayText,
      closeModal,
      openModal,
    ],
  )

  return {
    isExternal,
    href,
    onPress,
  }
}

export type LinkProps = Omit<BaseLinkProps, 'warnOnMismatchingTextChild'> &
  Omit<ButtonProps, 'style' | 'onPress' | 'disabled' | 'label'> & {
    /**
     * Label for a11y. Defaults to the href.
     */
    label?: string
  }

/**
 * A interactive element that renders as a `<a>` tag on the web. On mobile it
 * will translate the `href` to navigator screens and params and dispatch a
 * navigation action.
 *
 * Intended to behave as a web anchor tag. For more complex routing, use a
 * `Button`.
 */
export function Link({children, to, action = 'push', ...rest}: LinkProps) {
  const {href, isExternal, onPress} = useLink({
    to,
    displayText: typeof children === 'string' ? children : '',
    action,
  })

  return (
    <Button
      label={href}
      {...rest}
      role="link"
      accessibilityRole="link"
      href={href}
      onPress={onPress}
      {...web({
        hrefAttrs: {
          target: isExternal ? 'blank' : undefined,
          rel: isExternal ? 'noopener noreferrer' : undefined,
        },
        dataSet: {
          // default to no underline, apply this ourselves
          noUnderline: '1',
        },
      })}>
      {children}
    </Button>
  )
}

export type InlineLinkProps = React.PropsWithChildren<
  BaseLinkProps &
    TextStyleProp & {
      /**
       * Label for a11y. Defaults to the href.
       */
      label?: string
    }
>

export function InlineLink({
  children,
  to,
  action = 'push',
  warnOnMismatchingTextChild,
  style,
  ...rest
}: InlineLinkProps) {
  const t = useTheme()
  const stringChildren = typeof children === 'string'
  const {href, isExternal, onPress} = useLink({
    to,
    displayText: stringChildren ? children : '',
    action,
    warnOnMismatchingTextChild,
  })
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  return (
    <TouchableWithoutFeedback
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onFocus={onFocus}
      onBlur={onBlur}>
      <Text
        label={href}
        {...rest}
        style={[
          {color: t.palette.primary_500},
          (focused || pressed) && {
            outline: 0,
            textDecorationLine: 'underline',
            textDecorationColor: t.palette.primary_500,
          },
          flatten(style),
        ]}
        role="link"
        accessibilityRole="link"
        href={href}
        {...web({
          hrefAttrs: {
            target: isExternal ? 'blank' : undefined,
            rel: isExternal ? 'noopener noreferrer' : undefined,
          },
          dataSet: stringChildren
            ? {}
            : {
                // default to no underline, apply this ourselves
                noUnderline: '1',
              },
        })}>
        {children}
      </Text>
    </TouchableWithoutFeedback>
  )
}
