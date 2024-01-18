import React from 'react'
import {
  Text,
  TextStyle,
  StyleProp,
  GestureResponderEvent,
  Linking,
} from 'react-native'
import {
  useLinkProps,
  useNavigation,
  StackActions,
} from '@react-navigation/native'
import {sanitizeUrl} from '@braintree/sanitize-url'

import {isWeb} from '#/platform/detection'
import {useTheme, web, flatten} from '#/alf'
import {Button, ButtonProps, useButtonContext} from '#/components/Button'
import {AllNavigatorParams, NavigationProp} from '#/lib/routes/types'
import {
  convertBskyAppUrlIfNeeded,
  isExternalUrl,
  linkRequiresWarning,
} from '#/lib/strings/url-helpers'
import {useModalControls} from '#/state/modals'
import {router} from '#/routes'

export type LinkProps = Omit<
  ButtonProps,
  'style' | 'onPress' | 'disabled' | 'label'
> & {
  /**
   * `TextStyle` to apply to the anchor element itself. Does not apply to any children.
   */
  style?: StyleProp<TextStyle>
  /**
   * The React Navigation `StackAction` to perform when the link is pressed.
   */
  action?: 'push' | 'replace' | 'navigate'
  /**
   * If true, will warn the user if the link text does not match the href. Only
   * works for Links with children that are strings i.e. text links.
   */
  warnOnMismatchingTextChild?: boolean
  label?: ButtonProps['label']
} & Pick<Parameters<typeof useLinkProps<AllNavigatorParams>>[0], 'to'>

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
  warnOnMismatchingTextChild,
  style,
  ...rest
}: LinkProps) {
  const navigation = useNavigation<NavigationProp>()
  const {href} = useLinkProps<AllNavigatorParams>({
    to:
      typeof to === 'string' ? convertBskyAppUrlIfNeeded(sanitizeUrl(to)) : to,
  })
  const isExternal = isExternalUrl(href)
  const {openModal, closeModal} = useModalControls()
  const onPress = React.useCallback(
    (e: GestureResponderEvent) => {
      const stringChildren = typeof children === 'string' ? children : ''
      const requiresWarning = Boolean(
        warnOnMismatchingTextChild &&
          stringChildren &&
          isExternal &&
          linkRequiresWarning(href, stringChildren),
      )

      if (requiresWarning) {
        e.preventDefault()

        openModal({
          name: 'link-warning',
          text: stringChildren,
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
      children,
      closeModal,
      openModal,
    ],
  )

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
      {typeof children === 'string' ? (
        <LinkText style={style}>{children}</LinkText>
      ) : (
        children
      )}
    </Button>
  )
}

function LinkText({
  children,
  style,
}: React.PropsWithChildren<{
  style?: StyleProp<TextStyle>
}>) {
  const t = useTheme()
  const {hovered} = useButtonContext()
  return (
    <Text
      style={[
        {color: t.palette.primary_500},
        hovered && {
          textDecorationLine: 'underline',
          textDecorationColor: t.palette.primary_500,
        },
        flatten(style),
      ]}>
      {children as string}
    </Text>
  )
}
