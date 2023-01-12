import {
  NavigationModel,
  NavigationTabModel,
} from './../../../src/state/models/navigation'
import * as flags from '../../../src/build-flags'

describe('NavigationModel', () => {
  let model: NavigationModel

  beforeEach(() => {
    model = new NavigationModel()
    model.setTitle([0, 0], 'title')
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should call the clear method', async () => {
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
    expect(model.isCurrentScreen(11, 0)).toEqual(false)
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

  it('should call the handleLink getter', () => {
    const navigateSpy = jest.spyOn(model.tab, 'navigate')
    const consoleSpy = jest.spyOn(console, 'error')

    model.handleLink('testlink')
    expect(consoleSpy).toHaveBeenCalled()

    model.handleLink('/testlink')
    expect(navigateSpy).toHaveBeenCalledWith('/testlink', undefined)

    model.handleLink('https://testlink')
    expect(navigateSpy).toHaveBeenCalledWith('/', undefined)
  })

  it('should call the switchTo getter', () => {
    const fixedTabResetSpy = jest.spyOn(model.tab, 'fixedTabReset')

    model.switchTo(0, false)
    expect(model.tabIndex).toBe(0)
    model.switchTo(1, false)
    expect(model.tabIndex).toBe(1)
    model.switchTo(0, true)
    expect(fixedTabResetSpy).toHaveBeenCalled()
  })

  describe('tabs not enabled', () => {
    jest.mock('../../../src/build-flags', () => ({
      TABS_ENABLED: false,
    }))

    afterAll(() => {
      jest.clearAllMocks()
    })

    it('should call the newTab getter', () => {
      // @ts-expect-error
      flags.TABS_ENABLED = false
      const navigateSpy = jest.spyOn(model.tab, 'navigate')
      model.newTab('testurl')
      expect(navigateSpy).toHaveBeenCalledWith('testurl', undefined)
    })

    it('should call the setActiveTab getter', () => {
      // @ts-expect-error
      flags.TABS_ENABLED = false
      const result = model.setActiveTab(0)
      expect(result).toBeUndefined()
    })

    it('should call the closeTab getter', () => {
      // @ts-expect-error
      flags.TABS_ENABLED = false
      const result = model.closeTab(0)
      expect(result).toBeUndefined()
    })
  })

  describe('tabs enabled', () => {
    jest.mock('../../../src/build-flags', () => ({
      TABS_ENABLED: true,
    }))

    afterAll(() => {
      jest.clearAllMocks()
    })

    it('should call the newTab getter', () => {
      // @ts-expect-error
      flags.TABS_ENABLED = true

      model.newTab('testurl', 'title')
      expect(model.tab.isNewTab).toBe(true)
      expect(model.tabIndex).toBe(2)
    })

    it('should call the setActiveTab getter', () => {
      // @ts-expect-error
      flags.TABS_ENABLED = true

      model.setActiveTab(0)
      expect(model.tabIndex).toBe(0)
    })

    it('should call the closeTab getter', () => {
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

describe('NavigationTabModel', () => {
  let navigation: NavigationModel
  let model: NavigationTabModel

  beforeEach(() => {
    navigation = new NavigationModel()
    model = navigation.tabs[0]
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should call the canGoBack getter', () => {
    expect(model.canGoBack).toBe(false)
  })

  it('should call the canGoForward getter', () => {
    expect(model.canGoForward).toBe(false)
  })

  it('should call the backTen getter', () => {
    expect(model.backTen).toEqual([])
  })

  it('should call the forwardTen getter', () => {
    expect(model.forwardTen).toEqual([])
  })

  it('should call the navigate method', () => {
    const refreshSpy = jest.spyOn(model, 'refresh')
    model.navigate('/')
    expect(refreshSpy).toHaveBeenCalledWith()
  })

  it('should call the goBack method', () => {
    model.goBack()
    expect(model.index).toBe(0)
  })

  it('should call the goForward method', () => {
    model.goForward()
    expect(model.index).toBe(0)
  })

  it('should call the goToIndex method', () => {
    model.goToIndex(0)
    expect(model.index).toBe(0)
  })

  it('should call the setIsNewTab method', () => {
    model.setIsNewTab(true)
    expect(model.isNewTab).toBe(true)
  })
})
