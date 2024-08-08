import React from 'react'
import {requireNativeViewManager} from 'expo-modules-core'

const NativeView: React.ComponentType<{ref: React.RefObject<any>}> =
  requireNativeViewManager('ExpoHLSDownload')

export class HLSDownloadView extends React.PureComponent {
  private nativeRef: React.RefObject<any> = React.createRef()

  constructor(props: {}) {
    super(props)
  }

  async downloadAsync(
    sourceUrl: string,
    progressCb: (progress: number) => void,
  ): Promise<string | null> {
    return await this.nativeRef.current.downloadAsync(sourceUrl, progressCb)
  }

  async cancelAsync(sourceUrl: string): Promise<void> {
    return await this.nativeRef.current.cancelAsync(sourceUrl)
  }

  render() {
    return <NativeView ref={this.nativeRef} style={{height: 100, width: 100}} />
  }
}
