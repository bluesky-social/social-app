import './vocabulary'

import React from 'react'
import {View} from 'react-native'
import {ErrorBoundary} from 'react-error-boundary'
import {ZodError} from 'zod'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {AppComponent} from './AppComponent'

export function AppComponentRegion({origin}: {origin: string}) {
  const t = useTheme()
  return (
    <View style={[a.border, t.atoms.border_contrast_medium, a.rounded_sm]}>
      <View
        style={[
          t.atoms.bg_contrast_25,
          a.px_md,
          a.py_sm,
          {
            borderTopLeftRadius: a.rounded_sm.borderRadius,
            borderTopRightRadius: a.rounded_sm.borderRadius,
          },
        ]}>
        <Text
          style={[
            t.atoms.text_contrast_medium,
            a.text_xs,
            {fontFamily: 'monospace'},
          ]}>
          {origin}
        </Text>
      </View>
      <View style={[a.px_md, a.py_lg]}>
        <ErrorBoundary fallbackRender={fallbackRender}>
          <AppComponent origin={origin} />
        </ErrorBoundary>
      </View>
    </View>
  )
}

function fallbackRender({error}: {error: Error}) {
  const msg =
    error instanceof ZodError
      ? `${error.issues[0].path.join('.')}: ${error.issues[0].message}`
      : error.toString()
  return (
    <View>
      <Text>{msg}</Text>
    </View>
  )
}
