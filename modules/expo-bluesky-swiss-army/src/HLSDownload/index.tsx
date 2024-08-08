import React from 'react'

import {NotImplementedError} from '../NotImplemented'
import {HLSDownloadViewProps} from './types'

export default class HLSDownloadView extends React.PureComponent<HLSDownloadViewProps> {
  constructor(props: HLSDownloadViewProps) {
    super(props)
  }

  isAvailable(): boolean {
    return false
  }

  async downloadAsync(
    sourceUrl: string,
    progressCb: (progress: number) => void,
  ): Promise<string | null> {
    throw new NotImplementedError({sourceUrl, progressCb})
  }

  async cancelAsync(sourceUrl: string): Promise<void> {
    throw new NotImplementedError({sourceUrl})
  }

  render() {
    return null
  }
}
