import {router} from '#/routes'

describe('Atmosphere routing', () => {
  it('uses /atmosphere as the screen destination', () => {
    expect(router.matchPath('/atmosphere')).toEqual(['Atmosphere', {}])
    expect(router.matchName('Atmosphere')?.build()).toBe('/atmosphere')
  })

  it('preserves the debug query parameter on the Atmosphere route', () => {
    expect(router.matchPath('/atmosphere?debug')).toEqual([
      'Atmosphere',
      {debug: ''},
    ])
  })

  it.each(['Activity', 'ActivityV2'])('removes the %s route name', name => {
    expect(router.matchName(name)).toBeUndefined()
  })

  it.each(['/activity', '/activity-v2'])(
    'removes the old %s destination',
    path => {
      expect(router.matchPath(path)).toEqual(['NotFound', {}])
    },
  )
})
