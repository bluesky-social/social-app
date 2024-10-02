import React from 'react'
import {StackActions, useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {flatten, useTheme} from '#/alf'
import {useDialogContext} from '#/components/Dialog'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {InlineLinkProps, useLink} from '#/components/Link'
import {NormalizedPressable} from '#/components/NormalizedPressable'
import {Text} from '#/components/Typography'
import {router} from '#/routes'

export function BottomSheetInlineLinkText({
  children,
  to,
  action = 'push',
  disableMismatchWarning,
  style,
  onPress: outerOnPress,
  label,
  shareOnLongPress,
  disableUnderline,
  ...rest
}: InlineLinkProps) {
  const t = useTheme()
  const stringChildren = typeof children === 'string'
  const navigation = useNavigation<NavigationProp>()
  const dialog = useDialogContext()

  const {href, isExternal, onLongPress} = useLink({
    to,
    displayText: stringChildren ? children : '',
    action,
    disableMismatchWarning,
    onPress: outerOnPress,
    shareOnLongPress,
  })
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  const onPress = () => {
    if (isExternal) {
      return
    }

    dialog.close()

    if (action === 'push') {
      navigation.dispatch(StackActions.push(...router.matchPath(href)))
    } else if (action === 'replace') {
      navigation.dispatch(StackActions.replace(...router.matchPath(href)))
    } else if (action === 'navigate') {
      // @ts-ignore
      navigation.navigate(...router.matchPath(href))
    } else {
      throw Error('Unsupported navigator action.')
    }
  }

  const flattenedStyle = flatten(style) || {}

  // eslint-disable-next-line bsky-internal/avoid-unwrapped-text
  return (
    <NormalizedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      role="link"
      accessibilityLabel={label}
      accessibilityHint=""
      style={{flexDirection: 'row'}}>
      <Text
        {...rest}
        style={[
          {color: t.palette.primary_500},
          pressed &&
            !disableUnderline && {
              textDecorationLine: 'underline',
              textDecorationColor:
                flattenedStyle.color ?? t.palette.primary_500,
            },
          flattenedStyle,
        ]}>
        {children}
      </Text>
    </NormalizedPressable>
  )
}
