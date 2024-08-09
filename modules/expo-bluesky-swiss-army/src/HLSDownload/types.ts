import {NativeSyntheticEvent} from 'react-native'

export interface HLSDownloadViewProps {
  downloaderUrl: string
  onSuccess: (e: NativeSyntheticEvent<{uri: string}>) => void

  onStart?: () => void
  onError?: (e: NativeSyntheticEvent<{message: string}>) => void
  onProgress?: (e: NativeSyntheticEvent<{progress: number}>) => void
}
