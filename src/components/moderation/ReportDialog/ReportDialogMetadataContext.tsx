import {createContext, useContext, useRef} from 'react'

export type ReportDialogMetadata = {
  videoTimestampSeconds?: number
}

export type ReportDialogMetadataRef = React.RefObject<ReportDialogMetadata>

const Context = createContext<ReportDialogMetadataRef | null>(null)
Context.displayName = 'ReportDialogMetadataContext'

/**
 * Scopes report metadata to a rendered subject. The mutable ref lets media
 * events update metadata without rerendering the post on every playback tick.
 */
export function Provider({children}: React.PropsWithChildren) {
  const metadata = useRef<ReportDialogMetadata>({})

  return <Context.Provider value={metadata}>{children}</Context.Provider>
}

export function useReportDialogMetadataContext() {
  return useContext(Context)
}
