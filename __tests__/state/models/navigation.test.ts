import {NavigationModel} from './../../../src/state/models/navigation'
import * as flags from '../../../src/build-flags'

describe('NavigationModel', () => {
  let model: NavigationModel

  beforeEach(() => {
    model = new NavigationModel()
    model.setTitle('0-0', 'title')
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should clear() to the correct base state', async () => {
    await model.clear()
    expect(model.tabCount).toBe(2)
    expect(model.tab).toEqual({
      fixedTabPurpose: 0,
      history: [
        {
          id: expect.anything(),
          ts: expect.anything(),
          url: '/',
        },
      ],
      id: expect.anything(),
      index: 0,
      isNewTab: false,
    })
  })

  it('should call the navigate method', async () => {
    const navigateSpy = jest.spyOn(model.tab, 'navigate')
    await model.navigate('testurl', 'teststring')
    expect(navigateSpy).toHaveBeenCalledWith('testurl', 'teststring')
  })

  it('should call the refresh method', async () => {
    const refreshSpy = jest.spyOn(model.tab, 'refresh')
    await model.refresh()
    expect(refreshSpy).toHaveBeenCalled()
  })

  it('should call the isCurrentScreen method', () => {
    expect(model.isCurrentScreen('11', 0)).toEqual(false)
  })

  it('should call the tab getter', () => {
    expect(model.tab).toEqual({
      fixedTabPurpose: 0,
      history: [
        {
          id: expect.anything(),
          ts: expect.anything(),
          url: '/',
        },
      ],
      id: expect.anything(),
      index: 0,
      isNewTab: false,
    })
  })

  it('should call the tabCount getter', () => {
    expect(model.tabCount).toBe(2)
  })

  describe('tabs not enabled', () => {
    jest.mock('../../../src/build-flags', () => ({
      TABS_ENABLED: false,
    }))

    afterAll(() => {
      jest.clearAllMocks()
    })

    it('should not create new tabs', () => {
      // @ts-expect-error
      flags.TABS_ENABLED = false
      model.newTab('testurl')
      expect(model.tab.isNewTab).toBe(false)
      expect(model.tabIndex).toBe(0)
    })

    it('should not change the active tab', () => {
      // @ts-expect-error
      flags.TABS_ENABLED = false
      model.setActiveTab(2)
      expect(model.tabIndex).toBe(0)
    })

    it('should note close tabs', () => {
      // @ts-expect-error
      flags.TABS_ENABLED = false
      model.closeTab(0)
      expect(model.tabCount).toBe(2)
    })
  })

  describe('tabs enabled', () => {
    jest.mock('../../../src/build-flags', () => ({
      TABS_ENABLED: true,
    }))

    afterAll(() => {
      jest.clearAllMocks()
    })

    it('should create new tabs', () => {
      // @ts-expect-error
      flags.TABS_ENABLED = true

      model.newTab('testurl', 'title')
      expect(model.tab.isNewTab).toBe(true)
      expect(model.tabIndex).toBe(2)
    })

    it('should change the current tab', () => {
      // @ts-expect-error
      flags.TABS_ENABLED = true

      model.setActiveTab(0)
      expect(model.tabIndex).toBe(0)
    })

    it('should close tabs', () => {
      // @ts-expect-error
      flags.TABS_ENABLED = true

      model.closeTab(0)
      expect(model.tabs).toEqual([
        {
          fixedTabPurpose: 1,
          history: [
            {
              id: expect.anything(),
              ts: expect.anything(),
              url: '/notifications',
            },
          ],
          id: expect.anything(),
          index: 0,
          isNewTab: false,
        },
      ])
      expect(model.tabIndex).toBe(0)
    })
  })
})
