import {computeAgeAssuranceState} from '#/ageAssurance/state'
import {AgeAssuranceAccess, AgeAssuranceStatus} from '#/ageAssurance/types'

jest.mock('#/ageAssurance/data', () => ({}))
jest.mock('#/ageAssurance/logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
  },
}))
jest.mock('#/state/session', () => ({}))

const geolocation = {
  countryCode: undefined,
  regionCode: undefined,
}

describe('computeAgeAssuranceState', () => {
  it('computes access while required account data is pending', () => {
    expect(
      computeAgeAssuranceState({
        hasSession: true,
        geolocation,
        config: {regions: []},
        otherRequiredDataStatus: 'pending',
      }),
    ).toMatchObject({
      status: AgeAssuranceStatus.Unknown,
      access: AgeAssuranceAccess.None,
    })
  })

  it('denies access when required account data fails', () => {
    expect(
      computeAgeAssuranceState({
        hasSession: true,
        geolocation,
        config: {regions: []},
        otherRequiredDataStatus: 'error',
      }),
    ).toEqual({
      status: AgeAssuranceStatus.Unknown,
      access: AgeAssuranceAccess.None,
      error: 'account-data',
    })
  })

  it('computes access after a successful response without a birthdate', () => {
    expect(
      computeAgeAssuranceState({
        hasSession: true,
        geolocation,
        config: {regions: []},
        metadata: {birthdate: undefined},
        otherRequiredDataStatus: 'success',
      }),
    ).toMatchObject({
      status: AgeAssuranceStatus.Unknown,
      access: AgeAssuranceAccess.None,
    })
  })

  it('preserves authoritative terminal server state without account data', () => {
    expect(
      computeAgeAssuranceState({
        hasSession: true,
        geolocation: {countryCode: 'AA', regionCode: undefined},
        config: {
          regions: [
            {
              countryCode: 'AA',
              minAccessAge: 13,
              rules: [],
            },
          ],
        },
        state: {status: 'blocked', access: 'none'},
        otherRequiredDataStatus: 'error',
      }),
    ).toMatchObject({
      status: AgeAssuranceStatus.Blocked,
      access: AgeAssuranceAccess.None,
    })
  })
})
