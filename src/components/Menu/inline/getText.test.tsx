import {Text} from 'react-native'
import {setupI18n} from '@lingui/core'
import {Trans as RuntimeTrans} from '@lingui/react'
import {Plural, Trans} from '@lingui/react/macro'

import {getText} from '#/components/Menu/inline/getText'

const i18n = setupI18n()
i18n.loadAndActivate({locale: 'en', messages: {}})

describe('getText', () => {
  it('passes strings and numbers through', () => {
    expect(getText('Copy link', i18n)).toBe('Copy link')
    expect(getText(7, i18n)).toBe('7')
  })

  it('joins arrays and skips empty nodes', () => {
    expect(getText(['a', null, false, undefined, 'b', 1], i18n)).toBe('ab1')
  })

  it('translates <Trans>', () => {
    expect(getText(<Trans>Copy link</Trans>, i18n)).toBe('Copy link')
  })

  it('interpolates <Trans> values, including element ones', () => {
    const name = 'alice'
    expect(getText(<Trans>Mute {name}</Trans>, i18n)).toBe('Mute alice')
    expect(
      getText(
        <Trans>
          Mute <Text>{name}</Text>
        </Trans>,
        i18n,
      ),
    ).toBe('Mute alice')
  })

  it('handles plurals', () => {
    const count = 3
    expect(
      getText(<Plural value={count} one="# day" other="# days" />, i18n),
    ).toBe('3 days')
  })

  it('uses the catalog when the message is stripped, as in production', () => {
    const translated = setupI18n()
    translated.loadAndActivate({
      locale: 'fr',
      messages: {abc123: 'Copier le lien'},
    })
    expect(getText(<RuntimeTrans id="abc123" />, translated)).toBe(
      'Copier le lien',
    )
  })

  it('reads through wrapping elements', () => {
    expect(
      getText(
        <>
          <Text>
            <Trans>Copy</Trans>
          </Text>{' '}
          link
        </>,
        i18n,
      ),
    ).toBe('Copy link')
  })

  it('gives up on components that compute their own text', () => {
    function DisplayName() {
      return 'alice'
    }
    expect(getText(<DisplayName />, i18n)).toBe('')
  })
})
