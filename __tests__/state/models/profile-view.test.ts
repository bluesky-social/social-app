import {RootStoreModel} from '../../../src/state/models/root-store'
import {ProfileViewModel} from './../../../src/state/models/profile-view'
import {sessionClient, SessionServiceClient} from '@atproto/api'
import {DEFAULT_SERVICE} from './../../../src/state/index'
import * as apilib from '../../../src/state/lib/api'

describe('ProfileViewModel', () => {
  let rootStore: RootStoreModel
  let model: ProfileViewModel
  let getProfileRequestSpy: jest.SpyInstance
  let updateProfileRequestSpy: jest.SpyInstance
  let muteProfileRequestSpy: jest.SpyInstance
  let unmuteProfileRequestSpy: jest.SpyInstance

  const data = {
    did: 'test did',
    handle: 'handle',
    declaration: {
      cid: '',
      actorType: '',
    },
    creator: 'did',
    displayName: 'handle',
    description: 'desc',
    avatar: '',
    banner: '',
    followersCount: 3,
    followsCount: 3,
    membersCount: 3,
    postsCount: 3,
  }

  beforeEach(() => {
    const api = sessionClient.service(DEFAULT_SERVICE) as SessionServiceClient
    rootStore = new RootStoreModel(api)
    model = new ProfileViewModel(rootStore, {actor: ''})

    getProfileRequestSpy = jest
      .spyOn(rootStore.api.app.bsky.actor, 'getProfile')
      .mockImplementation((): Promise<any> => {
        return Promise.resolve({
          data,
        })
      })

    updateProfileRequestSpy = jest
      .spyOn(rootStore.api.app.bsky.actor, 'updateProfile')
      .mockImplementation((): Promise<any> => {
        return Promise.resolve()
      })

    muteProfileRequestSpy = jest
      .spyOn(rootStore.api.app.bsky.graph, 'mute')
      .mockImplementation((): Promise<any> => {
        return Promise.resolve()
      })

    unmuteProfileRequestSpy = jest
      .spyOn(rootStore.api.app.bsky.graph, 'unmute')
      .mockImplementation((): Promise<any> => {
        return Promise.resolve()
      })
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should call the setup method', async () => {
    await model.setup()
    expect(getProfileRequestSpy).toHaveBeenCalled()
    expect(model.did).toEqual(data.did)
    expect(model.handle).toEqual(data.handle)
    expect(model.declaration).toEqual(data.declaration)
    expect(model.creator).toEqual(data.creator)
    expect(model.displayName).toEqual(data.displayName)
    expect(model.description).toEqual(data.description)
    expect(model.avatar).toEqual(data.avatar)
    expect(model.banner).toEqual(data.banner)
    expect(model.followersCount).toEqual(data.followersCount)
    expect(model.followsCount).toEqual(data.followsCount)
    expect(model.membersCount).toEqual(data.membersCount)
    expect(model.postsCount).toEqual(data.postsCount)
  })

  it('should call the refresh method', async () => {
    await model.refresh()
    expect(getProfileRequestSpy).toHaveBeenCalled()
    expect(model.did).toEqual(data.did)
    expect(model.handle).toEqual(data.handle)
    expect(model.declaration).toEqual(data.declaration)
    expect(model.creator).toEqual(data.creator)
    expect(model.displayName).toEqual(data.displayName)
    expect(model.description).toEqual(data.description)
    expect(model.avatar).toEqual(data.avatar)
    expect(model.banner).toEqual(data.banner)
    expect(model.followersCount).toEqual(data.followersCount)
    expect(model.followsCount).toEqual(data.followsCount)
    expect(model.membersCount).toEqual(data.membersCount)
    expect(model.postsCount).toEqual(data.postsCount)
  })

  it('should call the toggleFollowing method', async () => {
    const followSpy = jest.spyOn(apilib, 'follow').mockResolvedValue({
      uri: 'testuri',
      cid: '',
    })
    const unfollowSpy = jest.spyOn(apilib, 'unfollow').mockResolvedValue()

    rootStore.me.did = 'testdid'
    await model.toggleFollowing()
    expect(followSpy).toHaveBeenCalled()

    await model.toggleFollowing()
    expect(unfollowSpy).toHaveBeenCalled()
  })

  it('should call the updateProfile method', async () => {
    await model.updateProfile(
      {
        displayName: 'new display',
        description: 'new desc',
        avatar: {
          cid: 'newcid',
          mimeType: 'image/jpeg',
        },
        banner: {
          cid: 'newcid2',
          mimeType: 'image/jpeg',
        },
      },
      undefined,
      undefined,
    )
    expect(updateProfileRequestSpy).toHaveBeenCalled()
    expect(getProfileRequestSpy).toHaveBeenCalled()
  })

  it('should call the muteAccount method', async () => {
    await model.muteAccount()
    expect(muteProfileRequestSpy).toHaveBeenCalled()
    expect(getProfileRequestSpy).toHaveBeenCalled()
    expect(model.myState.muted).toEqual(true)
  })

  it('should call the unmuteAccount method', async () => {
    await model.unmuteAccount()
    expect(unmuteProfileRequestSpy).toHaveBeenCalled()
    expect(getProfileRequestSpy).toHaveBeenCalled()
    expect(model.myState.muted).toEqual(false)
  })

  it('should call the hasContent getter', () => {
    expect(model.hasContent).toBe(false)
  })

  it('should call the hasError getter', () => {
    expect(model.hasError).toBe(false)
  })

  it('should call the isEmpty getter', () => {
    expect(model.isEmpty).toBe(false)
  })

  it('should call the isUser getter', () => {
    expect(model.isUser).toBe(false)
  })

  it('should call the isScene getter', () => {
    expect(model.isScene).toBe(false)
  })
})
