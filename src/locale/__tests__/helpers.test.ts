import {expect, test} from '@jest/globals'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {AppLanguage} from '#/locale/languages'

test('sanitizeAppLanguageSetting', () => {
  expect(sanitizeAppLanguageSetting('en')).toBe(AppLanguage.en)
  expect(sanitizeAppLanguageSetting('pt-BR')).toBe(AppLanguage.pt_BR)
  expect(sanitizeAppLanguageSetting('hi')).toBe(AppLanguage.hi)
  expect(sanitizeAppLanguageSetting('id')).toBe(AppLanguage.id)
  expect(sanitizeAppLanguageSetting('foo')).toBe(AppLanguage.en)
  expect(sanitizeAppLanguageSetting('en,foo')).toBe(AppLanguage.en)
  expect(sanitizeAppLanguageSetting('foo,en')).toBe(AppLanguage.en)
})
