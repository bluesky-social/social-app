import {RootStoreModel} from '../../../src/state/models/root-store'
import {LinkMetasViewModel} from '../../../src/state/models/link-metas-view'
import * as LinkMetaLib from '../../../src/lib/link-meta'
import {LikelyType} from './../../../src/lib/link-meta'
import {sessionClient, SessionServiceClient} from '@atproto/api'
import {DEFAULT_SERVICE} from '../../../src/state'

describe('LinkMetasViewModel', () => {
  let viewModel: LinkMetasViewModel
  let rootStore: RootStoreModel

  const getLinkMetaMockSpy = jest.spyOn(LinkMetaLib, 'getLinkMeta')
  const mockedMeta = {
    title: 'Test Title',
    url: 'testurl',
    likelyType: LikelyType.Other,
  }

  beforeEach(() => {
    const api = sessionClient.service(DEFAULT_SERVICE) as SessionServiceClient
    rootStore = new RootStoreModel(api)
    viewModel = new LinkMetasViewModel(rootStore)
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  describe('getLinkMeta', () => {
    it('should return link meta if it is cached', async () => {
      const url = 'http://example.com'

      viewModel.cache.set(url, mockedMeta)

      const result = await viewModel.getLinkMeta(url)

      expect(getLinkMetaMockSpy).not.toHaveBeenCalled()
      expect(result).toEqual(mockedMeta)
    })

    it('should return link meta if it is not cached', async () => {
      getLinkMetaMockSpy.mockResolvedValueOnce(mockedMeta)

      const result = await viewModel.getLinkMeta(mockedMeta.url)

      expect(getLinkMetaMockSpy).toHaveBeenCalledWith(rootStore, mockedMeta.url)
      expect(result).toEqual(mockedMeta)
    })

    it('should cache the link meta if it is successfully returned', async () => {
      getLinkMetaMockSpy.mockResolvedValueOnce(mockedMeta)

      await viewModel.getLinkMeta(mockedMeta.url)

      expect(viewModel.cache.get(mockedMeta.url)).toEqual(mockedMeta)
    })

    it('should not cache the link meta if it fails to return', async () => {
      const url = 'http://example.com'
      const error = new Error('Failed to fetch link meta')
      getLinkMetaMockSpy.mockRejectedValueOnce(error)

      try {
        await viewModel.getLinkMeta(url)
        fail('Error was not thrown')
      } catch (e) {
        expect(e).toEqual(error)
        expect(viewModel.cache.get(url)).toBeUndefined()
      }
    })
  })
})
