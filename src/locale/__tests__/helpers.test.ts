import {test, expect} from '@jest/globals'

import {sanitizeAppLanguageSetting} from '#/locale/helpers'
import {AppLanguage} from '#/locale/languages'

test('sanitizeAppLanguageSetting', () => {
  expect(sanitizeAppLanguageSetting('en')).toBe(AppLanguage.en)
  expect(sanitizeAppLanguageSetting('hi')).toBe(AppLanguage.hi)
  expect(sanitizeAppLanguageSetting('foo')).toBe(AppLanguage.en)
  expect(sanitizeAppLanguageSetting('en,foo')).toBe(AppLanguage.en)
  expect(sanitizeAppLanguageSetting('foo,en')).toBe(AppLanguage.en)
})
