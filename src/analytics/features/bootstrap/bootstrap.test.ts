import {readFeatureBootstrap} from './index.web'

const options = {apiHost: 'https://events.test/gb', clientKey: 'sdk-test'}
const payload = {
  features: {demo: {defaultValue: true}},
  savedGroups: {beta: ['did:plc:beta']},
  dateUpdated: '2020-01-01T00:00:00Z',
}

const originalDocument = globalThis.document
let textContent: string | null

beforeEach(() => {
  textContent = JSON.stringify({
    schemaVersion: 1,
    ...options,
    fetchedAt: new Date().toISOString(),
    payload,
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {getElementById: () => ({textContent})},
  })
})

afterEach(() => {
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: originalDocument,
  })
})

it('accepts recently fetched rules even when the configuration has not changed for years', () => {
  expect(readFeatureBootstrap(options)).toEqual(payload)
})

it.each([null, '', 'invalid JSON', '{}', 'null', '[]'])(
  'ignores absent or invalid bootstrap data: %s',
  text => {
    textContent = text
    expect(readFeatureBootstrap(options)).toBeUndefined()
  },
)

it.each([
  {schemaVersion: 2},
  {apiHost: 'https://staging.test/gb'},
  {clientKey: 'sdk-other'},
  {fetchedAt: 'not a date'},
  {fetchedAt: '2020-01-01T00:00:00Z'},
  {payload: null},
  {payload: {...payload, features: []}},
  {payload: {...payload, features: {demo: null}}},
  {payload: {...payload, features: {demo: {rules: [null]}}}},
  {payload: {...payload, dateUpdated: 'invalid'}},
  {payload: {...payload, savedGroups: {beta: null}}},
])('rejects incompatible or malformed data: %j', override => {
  textContent = JSON.stringify({...JSON.parse(textContent!), ...override})
  expect(readFeatureBootstrap(options)).toBeUndefined()
})
