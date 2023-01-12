import {RootStoreModel} from '../../../src/state/models/root-store'
import {SessionModel} from '../../../src/state/models/session'
import {sessionClient, SessionServiceClient} from '@atproto/api'
import {DEFAULT_SERVICE} from '../../../src/state/index'

describe('SessionModel', () => {
  let rootStore: RootStoreModel
  let model: SessionModel
  let logoutRequestSpy: jest.SpyInstance
  let connectRequestSpy: jest.SpyInstance

  const account = {
    service: 'https://bsky.social',
    refreshJwt: 'refreshJwt',
    accessJwt: 'accessJwt',
    handle: 'handle',
    did: 'did',
  }

  beforeEach(() => {
    const api = sessionClient.service(DEFAULT_SERVICE) as SessionServiceClient
    rootStore = new RootStoreModel(api)
    model = new SessionModel(rootStore)

    logoutRequestSpy = jest
      .spyOn(rootStore.api.com.atproto.session, 'delete')
      .mockImplementation((): Promise<any> => {
        return Promise.resolve()
      })

    connectRequestSpy = jest
      .spyOn(rootStore.api.com.atproto.session, 'get')
      .mockImplementation((): Promise<any> => {
        return Promise.resolve({
          success: true,
          data: {
            did: 'did',
          },
        })
      })
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should call the createAccount method', async () => {
    // await model.createAccount({
    //   service: account.service,
    //   email: 'email@email.com',
    //   password: 'password',
    //   handle: account.handle,
    // })
    // TODO
    // unable to spyOn newly assigned api
  })

  it('should call the login method', async () => {
    // await model.login({
    //   service: account.service,
    //   handle: account.handle,
    //   password: 'password',
    // })
    // TODO
    // unable to spyOn newly assigned api
  })

  it('should call the describeServices method', async () => {
    // await model.describeService(account.service)
    // TODO
    // unable to spyOn newly assigned api
  })

  it('should call the logout method', async () => {
    model.setState(account)
    await model.logout()

    expect(logoutRequestSpy).toHaveBeenCalledWith()
  })

  it('should call the connect method', async () => {
    model.setState(account)
    await model.connect()

    expect(connectRequestSpy).toHaveBeenCalledWith()
  })

  it('should call the updateAuthTokens method', async () => {
    model.setState(account)
    await model.updateAuthTokens({
      accessJwt: 'new token',
      refreshJwt: 'new token',
    })

    expect(model.data).toEqual({
      ...account,
      accessJwt: 'new token',
      refreshJwt: 'new token',
    })
  })
})
