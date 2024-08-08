export interface HLSDownloadViewProps {
  downloaderUrl: string
  onSuccess: (uri: string) => void

  onStart?: () => void
  onError?: (message: string) => void
  onProgress?: (progress: number) => void
}
