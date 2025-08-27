// Auto-generated Gander Social development configuration
// Generated: Tue Aug 26 18:14:06 ADT 2025
// Host IP: 192.168.68.120

import { Platform } from 'react-native'

// Helper to select URL based on platform
const selectUrl = (ios: string, android: string, physical: string) => {
  if (Platform.OS === 'ios') {
    // iOS Simulator can use localhost
    return ios
  } else if (Platform.OS === 'android') {
    // Android Emulator needs special IP or port forwarding
    return android
  } else {
    // Physical devices need host IP
    return physical
  }
}

export const DEV_SERVICES = {
  // AT Protocol Services
  PLC_URL: selectUrl(
    'http://localhost:2582',
    'http://localhost:2582', // Using port forwarding
    'http://192.168.68.120:2582'
  ),
  
  PDS_URL: selectUrl(
    'http://localhost:2583',
    'http://localhost:2583', // Using port forwarding
    'http://192.168.68.120:2583'
  ),
  
  APPVIEW_URL: selectUrl(
    'http://localhost:2584',
    'http://localhost:2584', // Using port forwarding
    'http://192.168.68.120:2584'
  ),
  
  BGS_URL: selectUrl(
    'ws://localhost:2470',
    'ws://localhost:2470', // Using port forwarding
    'ws://192.168.68.120:2470'
  ),
  
  // Default service for authentication
  DEFAULT_SERVICE: selectUrl(
    'http://localhost:2583',
    'http://localhost:2583',
    'http://192.168.68.120:2583'
  ),
  
  // Host IP for debugging
  HOST_IP: '192.168.68.120',
  
  // Development flags
  IS_DEV: true,
  USE_LOCAL_SERVICES: true,
}

// Export individual URLs for backward compatibility
export const PLC_URL = DEV_SERVICES.PLC_URL
export const PDS_URL = DEV_SERVICES.PDS_URL
export const APPVIEW_URL = DEV_SERVICES.APPVIEW_URL
export const BGS_URL = DEV_SERVICES.BGS_URL
export const DEFAULT_SERVICE = DEV_SERVICES.DEFAULT_SERVICE
