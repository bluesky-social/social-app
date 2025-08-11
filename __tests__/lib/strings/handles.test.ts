import {type IsValidHandle, validateServiceHandle} from '#/lib/strings/handles'

describe('handle validation', () => {
  const valid = [
    ['ali', 'gndr.social'],
    ['alice', 'gndr.social'],
    ['a-lice', 'gndr.social'],
    ['a-----lice', 'gndr.social'],
    ['123', 'gndr.social'],
    ['123456789012345678', 'gndr.social'],
    ['alice', 'custom-pds.com'],
    ['alice', 'my-custom-pds-with-long-name.social'],
    ['123456789012345678', 'my-custom-pds-with-long-name.social'],
  ]
  it.each(valid)(`should be valid: %s.%s`, (handle, service) => {
    const result = validateServiceHandle(handle, service)
    expect(result.overall).toEqual(true)
  })

  const invalid = [
    ['al', 'gndr.social', 'frontLength'],
    ['-alice', 'gndr.social', 'hyphenStartOrEnd'],
    ['alice-', 'gndr.social', 'hyphenStartOrEnd'],
    ['%%%', 'gndr.social', 'handleChars'],
    ['1234567890123456789', 'gndr.social', 'frontLength'],
    [
      '1234567890123456789',
      'my-custom-pds-with-long-name.social',
      'frontLength',
    ],
    ['al', 'my-custom-pds-with-long-name.social', 'frontLength'],
    ['a'.repeat(300), 'toolong.com', 'totalLength'],
  ] satisfies [string, string, keyof IsValidHandle][]
  it.each(invalid)(
    `should be invalid: %s.%s due to %s`,
    (handle, service, expectedError) => {
      const result = validateServiceHandle(handle, service)
      expect(result.overall).toEqual(false)
      expect(result[expectedError]).toEqual(false)
    },
  )
})
