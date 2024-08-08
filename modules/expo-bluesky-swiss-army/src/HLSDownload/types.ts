export interface HLSDownloadViewProps {
  downloaderUrl: string
  onSuccess: (uri: string) => void

  onStart?: () => void
  onError?: (error: string) => void
  onProgress?: (progress: number) => void
}
