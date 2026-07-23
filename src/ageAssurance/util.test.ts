import {getAgeAssuranceRegionConfig} from '@atproto/api'

import {getAgeAssuranceRegionConfigForGeolocation} from '#/ageAssurance/util'

jest.mock('#/ageAssurance/data')
jest.mock('@atproto/api', () => ({
  ...jest.requireActual('@atproto/api'),
  getAgeAssuranceRegionConfig: jest.fn(),
}))

/*
 * Platform-based region filtering itself is implemented and tested in
 * `@atproto/api` (see `getAgeAssuranceRegionConfig`). What we own - and test
 * here - is that region resolution passes the current platform through. The
 * jest preset is `jest-expo/ios`, so `AGE_ASSURANCE_PLATFORM` resolves to
 * `ios` in these tests.
 */
describe('getAgeAssuranceRegionConfigForGeolocation', () => {
  it('passes the current platform to the SDK region matcher', () => {
    const config = {regions: []}
    getAgeAssuranceRegionConfigForGeolocation(config, {
      countryCode: 'US',
      regionCode: 'TX',
    })
    expect(getAgeAssuranceRegionConfig).toHaveBeenCalledWith(config, {
      countryCode: 'US',
      regionCode: 'TX',
      platform: 'ios',
    })
  })
})
