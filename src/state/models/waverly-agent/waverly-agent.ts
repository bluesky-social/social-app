import {
  ApolloClient,
  ApolloLink,
  createHttpLink,
  InMemoryCache,
  GraphQLRequest,
  gql,
} from '@apollo/client'
import {setContext} from '@apollo/client/link/context'

import {getSdkApollo} from 'w2-api/index'
import {
  GetGroupWaveDocument,
  GroupWave,
  Recommendation,
} from 'w2-api/waverly_sdk'

import {onError} from '@apollo/client/link/error'
import {makeAutoObservable} from 'mobx'
import {RootStoreModel} from '../root-store'
import {isDevice} from 'expo-device'

// TODO:Future - Check if Apollo caching is working with getSdk approach

export type WaverlyEndpoint = 'test' | 'local'

const HEALTH_PATH = '/health'
const GRAPHQL_PATH = '/graphql'

const ENDPOINTS: {[key in WaverlyEndpoint]: string} = {
  test: 'https://api.test.waverly.social',
  local: 'http://localhost:5100',
}

export const LOCAL_ALLOWED = !isDevice

export class WaverlyAgent {
  _endpoint: WaverlyEndpoint = LOCAL_ALLOWED ? 'local' : 'test'
  _client: ApolloClient<any>
  _api: ReturnType<typeof getSdkApollo>
  _token?: string = undefined

  get endpoint() {
    return this._endpoint
  }

  get serviceUri() {
    return ENDPOINTS[this._endpoint] + GRAPHQL_PATH
  }

  get api() {
    return this._api
  }

  constructor(public rootStore: RootStoreModel) {
    this._client = this._createClient()
    this._api = this._createApi()
    if (this._endpoint === 'local') this._ensureLocalAllowed()
    makeAutoObservable(
      this,
      {
        rootStore: false,
        _client: false,
        _api: false,
        _createClient: false,
        _createApi: false,
      },
      {autoBind: true},
    )
  }

  _createClient() {
    this.rootStore.log.debug('WaverlyAgent:init')
    const httpLink = createHttpLink({uri: this.serviceUri})

    const errorLink = onError(({networkError, operation, graphQLErrors}) => {
      if (networkError) {
        this.rootStore.log.error('WaverlyAgent:init - network error in:', {
          operationName: operation.operationName,
          networkError,
        })
      } else if (graphQLErrors) {
        this.rootStore.log.error('WaverlyAgent:init - graphql error in::', {
          operationName: operation.operationName,
          graphQLErrors: JSON.stringify(graphQLErrors, null, 2),
        })
      } else {
        this.rootStore.log.error(
          'WaverlyAgent:init - unknown error in:',
          JSON.stringify(operation),
        )
      }
    })

    const authLink = setContext(
      async (operation: GraphQLRequest, {headers}) => {
        this.rootStore.log.debug(
          'WaverlyAgent - GraphQLRequest:',
          operation.operationName,
        )
        return {
          headers: {
            ...headers,
            authorization: this._token,
          },
        }
      },
    )

    return (this._client = new ApolloClient({
      link: ApolloLink.from([errorLink, authLink, httpLink]),
      cache: new InMemoryCache({
        typePolicies: {
          Recommendation: {
            keyFields: ['id'],
          },
        },
      }),
    }))
  }

  async _ensureLocalAllowed() {
    let allowed = false
    try {
      allowed = (await fetch(ENDPOINTS.local + HEALTH_PATH)).ok
    } catch (error) {}
    if (!allowed) this.setEndpoint('test')
  }

  _createApi() {
    return (this._api = getSdkApollo(this._client))
  }

  _setToken(jwt: string | undefined) {
    this.rootStore.log.debug('WaverlyAgent:_setToken')
    this._token = `Bearer ${jwt}`
  }

  onSessionChange(jwt: string | undefined) {
    this.rootStore.log.debug('WaverlyAgent:onSessionChange')
    this._setToken(jwt)
    this._createClient()
    this._createApi()
  }

  setEndpoint(endpoint: WaverlyEndpoint) {
    if (this.endpoint === endpoint || (endpoint === 'local' && !LOCAL_ALLOWED))
      return
    this.rootStore.log.debug(
      `WaverlyAgent:setEndpoint Switching to '${endpoint}'`,
    )
    this._endpoint = endpoint
    this._createClient()
    this._createApi()
  }

  async searchGroup(query: string) {
    const res = await this._api.searchGroup(
      {query},
      {fetchPolicy: 'network-only'},
    )
    return res.searchGroup
  }

  async addOrUpdateGroupWave(groupDid: string, text: string) {
    const res = await this._api.addOrUpdateGroupWave({
      input: {groupDid, text},
    })

    if (res.addOrUpdateGroupWave) {
      const resp = {...res.addOrUpdateGroupWave}
      delete resp.__typename
      this._client.writeQuery({
        query: GetGroupWaveDocument,
        variables: {groupDid},
        data: {getGroupWave: resp},
      })
    }

    return res.addOrUpdateGroupWave
  }

  async getQueryRecommendations(waves: GroupWave[], count?: number) {
    const processedWaves = waves.map(w => {
      const cpy = {...w}
      delete cpy.__typename
      return cpy
    })

    const res = await this._api.getQueryRecommendations(
      {waves: processedWaves, count},
      {fetchPolicy: 'network-only'},
    )

    if (!res.getQueryRecommendations)
      throw new Error('getQueryRecommendations returned invalid result')

    return res.getQueryRecommendations.recommendations
  }

  getRecommendationFromCache(id: string) {
    const identifier = {
      __typename: 'Recommendation',
      id,
    }
    const rec: Recommendation | null = this._client.cache.readFragment({
      id: this._client.cache.identify(identifier),
      fragment: gql`
        fragment ReaderViewRec on Recommendation {
          id
          source
          sectionTitle
          title
          href
          author
          summary
          time
          publish_date
          og_image
        }
      `,
    })
    return rec ?? undefined
  }
}
