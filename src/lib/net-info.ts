import NetInfo, {
  NetInfoState,
  NetInfoSubscription,
} from '@react-native-community/netinfo'

type NetworkStateChangeListener = (state: NetInfoState) => void

class NetInfoAPI {
  private subscription: NetInfoSubscription | null = null
  private listeners: NetworkStateChangeListener[] = []

  constructor() {
    this.subscribe()
  }

  private subscribe() {
    this.subscription = NetInfo.addEventListener(this.handleNetworkStateChange)
  }

  private handleNetworkStateChange = (state: NetInfoState) => {
    this.listeners.forEach(listener => listener(state))
  }

  public addListener(listener: NetworkStateChangeListener) {
    this.listeners.push(listener)
  }

  public removeListener(listener: NetworkStateChangeListener) {
    const index = this.listeners.indexOf(listener)
    if (index !== -1) {
      this.listeners.splice(index, 1)
    }
  }
}

export const netInfoAPI = new NetInfoAPI()
