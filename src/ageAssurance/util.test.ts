import {getAgeAssuranceRegionConfigForGeolocation} from '#/ageAssurance/util'
import {type app} from '#/lexicons'

jest.mock('#/ageAssurance/data')

/*
 * Platform scoping is applied locally in `util.ts` (the SDK region matcher
 * takes no platform filter). The jest preset is `jest-expo/ios`, so
 * `AGE_ASSURANCE_PLATFORM` resolves to `ios` in these tests.
 */
describe('getAgeAssuranceRegionConfigForGeolocation', () => {
  const region = (
    countryCode: string,
    regionCode?: string,
    platforms?: app.bsky.ageassurance.defs.ConfigRegion['platforms'],
  ): app.bsky.ageassurance.defs.ConfigRegion => ({
    countryCode,
    regionCode,
    platforms,
    minAccessAge: 13,
    rules: [],
  })

  it('skips regions for other platforms and continues matching', () => {
    const web = region('US', undefined, ['web'])
    const ios = region('US', undefined, ['ios'])

    expect(
      getAgeAssuranceRegionConfigForGeolocation(
        {regions: [web, ios]},
        {countryCode: 'US', regionCode: undefined},
      ),
    ).toBe(ios)
  })

  it('matches a region-specific config before a later country config', () => {
    const texas = region('US', 'TX')
    const us = region('US')

    expect(
      getAgeAssuranceRegionConfigForGeolocation(
        {regions: [texas, us]},
        {countryCode: 'US', regionCode: 'TX'},
      ),
    ).toBe(texas)
  })
})
