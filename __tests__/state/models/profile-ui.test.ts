import {DEFAULT_SERVICE, RootStoreModel} from '../../../src/state'
import {ProfileUiModel} from '../../../src/state/models/profile-ui'
import {sessionClient, SessionServiceClient} from '@atproto/api'

describe('ProfileUiModel', () => {
  let rootStore: RootStoreModel
  let model: ProfileUiModel
  let api: SessionServiceClient

  beforeEach(() => {
    api = sessionClient.service(DEFAULT_SERVICE) as SessionServiceClient
    rootStore = new RootStoreModel(api)
    model = new ProfileUiModel(rootStore, {user: ''})
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should call the setup method', async () => {
    await model.setup()
    expect(model.isRefreshing).toBe(false)
    // TODO
    // unable to spyOn requests
    // expect(profileSetupMock).toHaveBeenCalled()
    // expect(feedSetupMock).toHaveBeenCalled()
  })

  it('should call the update method', async () => {
    await model.update()
    expect(model.isRefreshing).toBe(false)
    // TODO
    // unable to spyOn requests
    // expect(viewUpdatesMock).toHaveBeenCalled()
  })

  it('should call the refresh method', async () => {
    await model.refresh()
    expect(model.isRefreshing).toBe(false)
    // TODO
    // unable to spyOn requests
    // expect(profileRefreshMock).toHaveBeenCalled()
    // expect(currentViewRefreshMock).toHaveBeenCalled()
  })

  it('should call the loadMore method', async () => {
    await model.loadMore()
    expect(model.isRefreshing).toBe(false)
    // TODO
    // unable to spyOn requests
    // expect(currentViewLoadMoreMock).toHaveBeenCalled()
  })

  it('should call the setSelectedViewIndex method', () => {
    model.setSelectedViewIndex(1)
    expect(model.selectedViewIndex).toBe(1)
  })

  it('should call the isRefreshing getter', () => {
    expect(model.isRefreshing).toEqual(false)
  })

  it('should call the selectorItems getter', () => {
    expect(model.selectorItems).toEqual(['Posts', 'Posts & replies', 'Scenes'])
  })
})
