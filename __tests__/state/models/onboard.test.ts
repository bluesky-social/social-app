import {
  OnboardModel,
  OnboardStageOrder,
} from '../../../src/state/models/onboard'

describe('OnboardModel', () => {
  let onboardModel: OnboardModel

  beforeEach(() => {
    onboardModel = new OnboardModel()
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should start/stop correctly', () => {
    onboardModel.start()
    expect(onboardModel.isOnboarding).toBe(true)
    onboardModel.stop()
    expect(onboardModel.isOnboarding).toBe(false)
  })

  it('should call the next method until it has no more stages', () => {
    onboardModel.start()
    onboardModel.next()
    expect(onboardModel.stage).toBe(OnboardStageOrder[1])

    onboardModel.next()
    expect(onboardModel.isOnboarding).toBe(false)
    expect(onboardModel.stage).toBe(OnboardStageOrder[0])
  })

  it('serialize and hydrate', () => {
    const serialized = onboardModel.serialize()
    const newModel = new OnboardModel()
    newModel.hydrate(serialized)
    expect(newModel).toEqual(onboardModel)

    onboardModel.start()
    onboardModel.next()
    const serialized2 = onboardModel.serialize()
    newModel.hydrate(serialized2)
    expect(newModel).toEqual(onboardModel)
  })
})
