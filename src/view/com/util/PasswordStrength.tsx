import React from 'react'
import {View} from 'react-native'

import {I18nContext, useLingui} from '@lingui/react'
import {Trans, msg} from '@lingui/macro'

import type {ZxcvbnResult} from '@zxcvbn-ts/core'

import {usePalette} from '#/lib/hooks/usePalette'
import {Text} from './text/Text'

export function PasswordStrength({result}: {result: ZxcvbnResult | null}) {
  const {_} = useLingui()

  const pal = usePalette('default')

  const score = result ? result.score : 0
  const {color, label} = getScoreInformation(score, _)

  return (
    <View style={{marginTop: 8, gap: 4}}>
      <View
        style={{
          flexDirection: 'row',
          gap: 4,
          borderRadius: 6,
          overflow: 'hidden',
        }}>
        {Array.from({length: 4}, (_, idx) => (
          <View
            key={idx}
            style={[
              {backgroundColor: score >= idx + 1 ? color : pal.colors.border},
              {height: 4, flexGrow: 1},
            ]}
          />
        ))}
      </View>

      <View>
        <Text type="md" style={pal.textLight}>
          <Trans>
            Password strength:{' '}
            <Text style={{color: color, fontWeight: '500'}}>{label}</Text>
          </Trans>
        </Text>
      </View>
    </View>
  )
}

function getScoreInformation(score: number, _: I18nContext['_']) {
  if (score >= 4) {
    return {color: '#65a30d', label: _(msg`Strong`)} // line-600
  }

  if (score >= 3) {
    return {color: '#ca8a04', label: _(msg`Good`)} // yellow-600
  }

  if (score >= 2) {
    return {color: '#f87171', label: _(msg`Weak`)}
  }

  return {color: '#f87171', label: _(msg`Very weak`)} // red-600
}
